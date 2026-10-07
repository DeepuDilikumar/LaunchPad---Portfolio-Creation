import { beforeAll, describe, expect, it, vi } from "vitest";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { applyCoupon, couponProblem, grantPurchase, handleWebhook, redeemGrantCoupon, scopesForProduct, type CouponRow } from "@/lib/payments";
import { activeScopes } from "@/lib/entitlements";

vi.spyOn(console, "log").mockImplementation(() => {});

const USER = "11111111-1111-4111-8111-111111111111";

async function newOrder(orderId: string, product = "pro-project", project: string | null = "pulse") {
  const db = await getDb();
  await db.insert(schema.users).values({ id: USER, email: "buyer@example.test" }).onConflictDoNothing();
  await db.insert(schema.profiles).values({ userId: USER, email: "buyer@example.test", handle: "buyer" }).onConflictDoNothing();
  await db.insert(schema.purchases).values({
    userId: USER,
    productSlug: product,
    projectSlug: project,
    provider: "mock",
    providerOrderId: orderId,
    amount: 149900,
    currency: "INR",
    returnTo: "/learn/pulse/delivery-receipts",
  });
}

async function counts(orderId: string) {
  const db = await getDb();
  const purchases = await db.select().from(schema.purchases).where(eq(schema.purchases.providerOrderId, orderId));
  const ents = await db
    .select()
    .from(schema.entitlements)
    .where(and(eq(schema.entitlements.userId, USER), eq(schema.entitlements.sourceId, purchases[0]!.id)));
  return { purchases, ents };
}

beforeAll(async () => {
  await getDb();
});

describe("grantPurchase idempotency", () => {
  it("double submit grants once", async () => {
    await newOrder("order_a");
    const [r1, r2] = await Promise.all([
      grantPurchase({ provider: "mock", orderId: "order_a", paymentId: "pay_a" }),
      grantPurchase({ provider: "mock", orderId: "order_a", paymentId: "pay_a" }),
    ]);
    expect(r1.ok && r2.ok).toBe(true);
    expect([r1.firstTime, r2.firstTime].filter(Boolean)).toHaveLength(1);
    const { purchases, ents } = await counts("order_a");
    expect(purchases).toHaveLength(1);
    expect(purchases[0]!.status).toBe("paid");
    expect(ents).toHaveLength(1);
    expect(ents[0]!.scope).toBe("project:pulse");
    expect(r1.returnTo).toBe("/learn/pulse/delivery-receipts");
  });

  it("verify + duplicate webhooks still grant once", async () => {
    await newOrder("order_b");
    await grantPurchase({ provider: "mock", orderId: "order_b", paymentId: "pay_b" });
    const evt = { eventId: "evt_b", type: "payment.captured", payload: {}, payment: { orderId: "order_b", paymentId: "pay_b", amount: 149900, currency: "INR" } };
    const w1 = await handleWebhook("mock", evt);
    const w2 = await handleWebhook("mock", evt);
    const w3 = await handleWebhook("mock", { ...evt, eventId: "evt_b2" });
    expect(w1).toMatchObject({ duplicate: false, processed: true });
    expect(w2.duplicate).toBe(true);
    expect(w3.processed).toBe(true);
    const { purchases, ents } = await counts("order_b");
    expect(purchases).toHaveLength(1);
    expect(ents).toHaveLength(1);
    const db = await getDb();
    const stored = await db.select().from(schema.webhookEvents).where(eq(schema.webhookEvents.provider, "mock"));
    expect(stored.filter((e) => e.eventId.startsWith("evt_b"))).toHaveLength(2);
  });

  it("a different payment can't claim an already-paid order", async () => {
    await newOrder("order_c");
    await grantPurchase({ provider: "mock", orderId: "order_c", paymentId: "pay_c" });
    const r = await grantPurchase({ provider: "mock", orderId: "order_c", paymentId: "pay_other" });
    expect(r.ok).toBe(false);
  });

  it("refund revokes, and a late duplicate capture does not restore access", async () => {
    await newOrder("order_d", "pro-all", null);
    await grantPurchase({ provider: "mock", orderId: "order_d", paymentId: "pay_d" });
    expect((await activeScopes(USER)).has("all")).toBe(true);
    await handleWebhook("mock", { eventId: "evt_refund_d", type: "refund.processed", payload: {}, refund: { paymentId: "pay_d", refundId: "rf_d" } });
    expect((await activeScopes(USER)).has("all")).toBe(false);
    await handleWebhook("mock", { eventId: "evt_late_d", type: "payment.captured", payload: {}, payment: { orderId: "order_d", paymentId: "pay_d", amount: 1, currency: "INR" } });
    expect((await activeScopes(USER)).has("all")).toBe(false);
  });

  it("unknown orders are stored and flagged, not granted", async () => {
    const r = await handleWebhook("mock", { eventId: "evt_unknown", type: "payment.captured", payload: {}, payment: { orderId: "order_nope", paymentId: "pay_x", amount: 1, currency: "INR" } });
    expect(r.processed).toBe(false);
    expect(r.error).toBe("unknown order");
  });
});

describe("products and coupons", () => {
  it("maps products to scopes", () => {
    expect(scopesForProduct("pro-project", "ledger")).toEqual(["project:ledger"]);
    expect(scopesForProduct("pro-all", null)).toEqual(["all"]);
    expect(scopesForProduct("review", null)).toEqual(["all", "review"]);
  });

  const coupon = (o: Partial<CouponRow>): CouponRow => ({
    id: 1,
    code: "X",
    kind: "percent",
    value: 0,
    scope: null,
    maxRedemptions: null,
    redemptions: 0,
    expiresAt: null,
    note: null,
    createdAt: new Date(),
    ...o,
  });

  it("applies discounts on the server price", () => {
    expect(applyCoupon(149900, coupon({ kind: "percent", value: 20 }))).toBe(119920);
    expect(applyCoupon(2500, coupon({ kind: "flat", value: 3000 }))).toBe(0);
    expect(applyCoupon(2500, undefined)).toBe(2500);
  });

  it("validates expiry and redemption limits", () => {
    expect(couponProblem(undefined)).toMatch(/doesn't exist/);
    expect(couponProblem(coupon({ expiresAt: new Date(Date.now() - 1000) }))).toMatch(/expired/);
    expect(couponProblem(coupon({ maxRedemptions: 2, redemptions: 2 }))).toMatch(/fully used/);
    expect(couponProblem(coupon({ maxRedemptions: 2, redemptions: 1 }))).toBeNull();
  });

  it("grant coupons respect max redemptions and one redemption per user", async () => {
    const db = await getDb();
    await db.insert(schema.coupons).values({ code: "COLLEGE-2", kind: "grant", scope: "all", maxRedemptions: 2 });
    const users = ["22222222-2222-4222-8222-000000000001", "22222222-2222-4222-8222-000000000002", "22222222-2222-4222-8222-000000000003"];
    const first = await redeemGrantCoupon(users[0]!, "college-2");
    const again = await redeemGrantCoupon(users[0]!, "COLLEGE-2");
    const second = await redeemGrantCoupon(users[1]!, "COLLEGE-2");
    const third = await redeemGrantCoupon(users[2]!, "COLLEGE-2");
    expect(first.ok).toBe(true);
    expect(again).toMatchObject({ ok: false, error: expect.stringMatching(/already redeemed/) });
    expect(second.ok).toBe(true);
    expect(third).toMatchObject({ ok: false, error: expect.stringMatching(/fully used/) });
    expect((await activeScopes(users[1]!)).has("all")).toBe(true);
    expect((await activeScopes(users[2]!)).has("all")).toBe(false);
  });
});
