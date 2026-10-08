import { z } from "zod";
import { randomBytes } from "node:crypto";
import { getSessionUser } from "@/lib/auth/session";
import { error, json, parseBody, safeReturnTo } from "@/lib/http";
import { getDb, schema } from "@/lib/db";
import { products } from "@/config/pricing";
import { getProject } from "@/content/catalog";
import { applyCoupon, couponProblem, findCoupon, getProvider, grantPurchase, reserveCoupon } from "@/lib/payments";
import { recordEvent } from "@/lib/analytics/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { site } from "@/config/site";

const body = z.object({
  product: z.enum(["pro-project", "pro-all", "review"]),
  project: z.string().max(40).optional(),
  currency: z.enum(["INR", "USD"]),
  coupon: z.string().trim().max(40).optional(),
  returnTo: z.string().max(500).optional(),
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return error(401, "Sign in to buy.");
  const rl = await rateLimit(`checkout:${user.id}:${clientIp(req)}`, 20, 600);
  if (!rl.ok) return error(429, "Too many checkout attempts. Wait a few minutes.");
  const [data, bad] = await parseBody(req, body);
  if (bad) return bad;

  const product = products[data.product];
  let project: string | null = null;
  if (product.grants === "project") {
    const p = data.project ? getProject(data.project) : undefined;
    if (!p || p.kind !== "project") return error(400, "Pick which project you're buying.");
    project = p.slug;
  }

  const db = await getDb();
  const coupon = data.coupon ? await findCoupon(db, data.coupon) : undefined;
  if (data.coupon) {
    const problem = couponProblem(coupon);
    if (problem) return error(400, problem);
    if (coupon!.kind === "grant") return error(400, "That code unlocks access directly. Redeem it on the pricing page.");
  }

  if (coupon) {
    const reserved = await reserveCoupon(user.id, coupon.id);
    if (!reserved.ok) return error(400, reserved.error);
  }

  // The amount always comes from config/pricing.ts, never from the client.
  const amount = applyCoupon(product.price[data.currency], coupon);
  const returnTo = safeReturnTo(data.returnTo, project ? `/projects/${project}` : "/dashboard");
  await recordEvent("checkout_started", user.id, { product: data.product, currency: data.currency });

  if (amount === 0) {
    const orderId = `order_free_${randomBytes(8).toString("hex")}`;
    await db.insert(schema.purchases).values({
      userId: user.id,
      productSlug: data.product,
      projectSlug: project,
      provider: "free",
      providerOrderId: orderId,
      amount: 0,
      currency: data.currency,
      couponCode: coupon?.code ?? null,
      returnTo,
    });
    await grantPurchase({ provider: "free", orderId, paymentId: `pay_free_${orderId}` });
    return json({ free: true, redirect: `/checkout/success?returnTo=${encodeURIComponent(returnTo)}` });
  }

  const provider = getProvider();
  const order = await provider.createOrder({
    amount,
    currency: data.currency,
    receipt: `bp_${randomBytes(6).toString("hex")}`,
    notes: { userId: user.id, product: data.product, project: project ?? "" },
  });
  await db.insert(schema.purchases).values({
    userId: user.id,
    productSlug: data.product,
    projectSlug: project,
    provider: order.provider,
    providerOrderId: order.orderId,
    amount: order.amount,
    currency: order.currency,
    couponCode: coupon?.code ?? null,
    returnTo,
  });
  return json({
    provider: order.provider,
    orderId: order.orderId,
    amount: order.amount,
    currency: order.currency,
    publicKey: order.publicKey,
    name: site.name,
    description: product.name,
    prefill: { email: user.email ?? "", name: user.profile.name },
  });
}
