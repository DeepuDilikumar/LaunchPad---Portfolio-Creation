import "server-only";
import { and, eq, isNull, sql } from "drizzle-orm";
import { mock } from "@/lib/env";
import { getDb, schema, type Db } from "@/lib/db";
import { formatPrice, products, type Currency, type ProductSlug } from "@/config/pricing";
import { getProject } from "@/content/catalog";
import { grantEntitlement, revokeEntitlements, type Scope } from "@/lib/entitlements";
import { recordEvent } from "@/lib/analytics/server";
import { sendEmail } from "@/lib/email";
import type { PaymentProvider, WebhookEvent } from "./provider";
import { mockProvider } from "./mock";
import { razorpay } from "./razorpay";

export function getProvider(name?: string): PaymentProvider {
  if (name === "mock" || (!name && mock.payments)) {
    if (!mock.payments) throw new Error("mock provider requested while real payments are configured");
    return mockProvider;
  }
  return razorpay;
}

export function scopesForProduct(slug: ProductSlug, project: string | null): Scope[] {
  const p = products[slug];
  if (p.grants === "project") return [`project:${project}`];
  if (p.grants === "all") return ["all"];
  return ["all", "review"];
}

export type CouponRow = typeof schema.coupons.$inferSelect;

export function couponProblem(c: CouponRow | undefined, now = new Date()): string | null {
  if (!c) return "That code doesn't exist.";
  if (c.expiresAt && c.expiresAt.getTime() < now.getTime()) return "That code has expired.";
  if (c.maxRedemptions !== null && c.redemptions >= c.maxRedemptions) return "That code has been fully used.";
  return null;
}

/** Server-side price: config price minus any percent/flat coupon. Never trusts the client. */
export function applyCoupon(amount: number, c: CouponRow | undefined): number {
  if (!c) return amount;
  if (c.kind === "percent") return Math.max(0, Math.round(amount * (1 - Math.min(100, c.value) / 100)));
  if (c.kind === "flat") return Math.max(0, amount - c.value);
  return amount;
}

export async function findCoupon(db: Db, code: string) {
  const [c] = await db.select().from(schema.coupons).where(eq(schema.coupons.code, code.trim().toUpperCase())).limit(1);
  return c;
}

/**
 * Record a successful payment and grant access. Idempotent: double-submits, duplicate
 * webhooks and the verify + webhook race all end with one paid purchase and one grant.
 */
export async function grantPurchase(input: { provider: string; orderId: string; paymentId: string }): Promise<{ ok: boolean; firstTime: boolean; returnTo: string | null; reason?: string }> {
  const db = await getDb();
  const result = await db.transaction(async (tx) => {
    const [purchase] = await tx
      .select()
      .from(schema.purchases)
      .where(and(eq(schema.purchases.provider, input.provider), eq(schema.purchases.providerOrderId, input.orderId)))
      .limit(1);
    if (!purchase) return { ok: false, firstTime: false, returnTo: null, reason: "unknown order" };
    if (purchase.status === "refunded") return { ok: false, firstTime: false, returnTo: purchase.returnTo, reason: "refunded" };
    if (purchase.providerPaymentId && purchase.providerPaymentId !== input.paymentId) {
      return { ok: false, firstTime: false, returnTo: purchase.returnTo, reason: "order already paid by a different payment" };
    }
    const updated = await tx
      .update(schema.purchases)
      .set({ status: "paid", providerPaymentId: input.paymentId, updatedAt: new Date() })
      .where(and(eq(schema.purchases.id, purchase.id), sql`${schema.purchases.status} <> 'paid'`))
      .returning({ id: schema.purchases.id });
    for (const scope of scopesForProduct(purchase.productSlug as ProductSlug, purchase.projectSlug)) {
      await grantEntitlement(tx as unknown as Db, { userId: purchase.userId, scope, source: "purchase", sourceId: purchase.id });
    }
    const firstTime = updated.length > 0;
    if (firstTime && purchase.couponCode) {
      const [c] = await tx.select().from(schema.coupons).where(eq(schema.coupons.code, purchase.couponCode)).limit(1);
      if (c) {
        const ins = await tx.insert(schema.couponRedemptions).values({ couponId: c.id, userId: purchase.userId }).onConflictDoNothing().returning({ id: schema.couponRedemptions.id });
        if (ins.length) await tx.update(schema.coupons).set({ redemptions: sql`${schema.coupons.redemptions} + 1` }).where(eq(schema.coupons.id, c.id));
      }
    }
    return { ok: true, firstTime, returnTo: purchase.returnTo, purchase };
  });

  if (result.ok && result.firstTime && "purchase" in result && result.purchase) {
    const p = result.purchase;
    await recordEvent("purchase_completed", p.userId, { product: p.productSlug, currency: p.currency, amount: p.amount });
    const [profile] = await db.select().from(schema.profiles).where(eq(schema.profiles.userId, p.userId)).limit(1);
    if (profile?.email) {
      const product = products[p.productSlug as ProductSlug];
      const projectName = p.projectSlug ? getProject(p.projectSlug)?.name : null;
      await sendEmail({
        to: profile.email,
        userId: p.userId,
        template: "receipt",
        data: {
          name: profile.name,
          product: projectName ? `${product.name} (${projectName})` : product.name,
          amount: formatPrice(p.amount, p.currency as Currency),
          paymentId: input.paymentId,
          date: new Date().toISOString().slice(0, 10),
          returnTo: p.returnTo ?? "/dashboard",
        },
      });
    }
  }
  return { ok: result.ok, firstTime: result.firstTime, returnTo: result.returnTo, reason: "reason" in result ? result.reason : undefined };
}

export async function revokePurchaseByPayment(paymentId: string) {
  const db = await getDb();
  const [p] = await db.select().from(schema.purchases).where(eq(schema.purchases.providerPaymentId, paymentId)).limit(1);
  if (!p) return false;
  await db.update(schema.purchases).set({ status: "refunded", updatedAt: new Date() }).where(eq(schema.purchases.id, p.id));
  await revokeEntitlements(db, { userId: p.userId, source: "purchase", sourceId: p.id });
  return true;
}

/** Store first, then process. A duplicate event id is acknowledged and ignored. */
export async function handleWebhook(provider: string, event: WebhookEvent): Promise<{ duplicate: boolean; processed: boolean; error?: string }> {
  const db = await getDb();
  const stored = await db
    .insert(schema.webhookEvents)
    .values({ provider, eventId: event.eventId, type: event.type, payload: event.payload as object })
    .onConflictDoNothing()
    .returning({ id: schema.webhookEvents.id });
  if (!stored.length) {
    const [prev] = await db
      .select()
      .from(schema.webhookEvents)
      .where(and(eq(schema.webhookEvents.provider, provider), eq(schema.webhookEvents.eventId, event.eventId), isNull(schema.webhookEvents.processedAt)))
      .limit(1);
    if (!prev) return { duplicate: true, processed: false };
    // Stored earlier but processing failed: retry it now.
  }
  let error: string | undefined;
  try {
    if (event.type === "payment.captured" && event.payment) {
      const r = await grantPurchase({ provider, orderId: event.payment.orderId, paymentId: event.payment.paymentId });
      if (!r.ok && r.reason !== "refunded") error = r.reason;
    } else if ((event.type === "refund.processed" || event.type === "refund.created") && event.refund) {
      await revokePurchaseByPayment(event.refund.paymentId);
    }
  } catch (e) {
    error = (e as Error).message;
  }
  await db
    .update(schema.webhookEvents)
    .set(error ? { error } : { processedAt: new Date(), error: null })
    .where(and(eq(schema.webhookEvents.provider, provider), eq(schema.webhookEvents.eventId, event.eventId)));
  return { duplicate: false, processed: !error, error };
}

export async function redeemGrantCoupon(userId: string, code: string): Promise<{ ok: true; scope: string } | { ok: false; error: string }> {
  const db = await getDb();
  try {
    return await db.transaction(async (tx) => {
      const c = await findCoupon(tx as unknown as Db, code);
      const problem = couponProblem(c);
      if (problem) return { ok: false as const, error: problem };
      if (c!.kind !== "grant" || !c!.scope) return { ok: false as const, error: "That's a discount code. Enter it at checkout." };
      const ins = await tx.insert(schema.couponRedemptions).values({ couponId: c!.id, userId }).onConflictDoNothing().returning({ id: schema.couponRedemptions.id });
      if (!ins.length) return { ok: false as const, error: "You've already redeemed this code." };
      const bumped = await tx
        .update(schema.coupons)
        .set({ redemptions: sql`${schema.coupons.redemptions} + 1` })
        .where(and(eq(schema.coupons.id, c!.id), sql`(${schema.coupons.maxRedemptions} is null or ${schema.coupons.redemptions} < ${schema.coupons.maxRedemptions})`))
        .returning({ id: schema.coupons.id });
      if (!bumped.length) throw new Error("exhausted");
      await grantEntitlement(tx as unknown as Db, { userId, scope: c!.scope as Scope, source: "coupon", sourceId: String(c!.id) });
      return { ok: true as const, scope: c!.scope };
    });
  } catch (e) {
    if ((e as Error).message === "exhausted") return { ok: false, error: "That code has been fully used." };
    throw e;
  }
}
