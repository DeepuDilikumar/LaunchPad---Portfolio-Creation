import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth/session";
import { error, json, parseBody } from "@/lib/http";
import { getDb, schema } from "@/lib/db";
import { getProvider, grantPurchase } from "@/lib/payments";

const body = z.object({
  provider: z.enum(["razorpay", "mock"]),
  orderId: z.string().max(100),
  paymentId: z.string().max(100),
  signature: z.string().max(200),
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return error(401, "Sign in first.");
  const [data, bad] = await parseBody(req, body);
  if (bad) return bad;
  const db = await getDb();
  const [purchase] = await db
    .select()
    .from(schema.purchases)
    .where(and(eq(schema.purchases.provider, data.provider), eq(schema.purchases.providerOrderId, data.orderId), eq(schema.purchases.userId, user.id)))
    .limit(1);
  if (!purchase) return error(404, "We couldn't find that order on your account.");
  let provider;
  try {
    provider = getProvider(data.provider);
  } catch {
    return error(400, "That payment method isn't available.");
  }
  if (!provider.verifyPayment(data)) return error(400, "The payment signature didn't match. You haven't been charged twice; contact us if money left your account.");
  const r = await grantPurchase({ provider: data.provider, orderId: data.orderId, paymentId: data.paymentId });
  if (!r.ok) return error(409, r.reason === "refunded" ? "This order was refunded." : "This order couldn't be completed.");
  return json({ ok: true, redirect: `/checkout/success?returnTo=${encodeURIComponent(r.returnTo ?? "/dashboard")}` });
}
