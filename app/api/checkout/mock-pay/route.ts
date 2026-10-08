import { z } from "zod";
import { createHash } from "node:crypto";
import { mockEndpointsEnabled } from "@/lib/env";
import { getSessionUser } from "@/lib/auth/session";
import { error, json, parseBody } from "@/lib/http";
import { mockSign } from "@/lib/payments/mock";

/** Mock checkout widget: "pays" an order and returns what Razorpay's handler would. Non-production only. */
export async function POST(req: Request) {
  if (!mockEndpointsEnabled("payments")) return error(404, "Not found");
  const user = await getSessionUser();
  if (!user) return error(401, "Sign in first.");
  const [data, bad] = await parseBody(req, z.object({ orderId: z.string().startsWith("order_mock_").max(100) }));
  if (bad) return bad;
  // Deterministic per order, like a real payment: paying twice yields the same payment id.
  const paymentId = `pay_mock_${createHash("sha256").update(data.orderId).digest("hex").slice(0, 14)}`;
  return json({ orderId: data.orderId, paymentId, signature: mockSign(data.orderId, paymentId) });
}
