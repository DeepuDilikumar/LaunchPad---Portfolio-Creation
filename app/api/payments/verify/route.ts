import { NextResponse } from "next/server"
import { z } from "zod"

import { getPlan, type ProductKey } from "@/config/pricing"
import { logEvent } from "@/lib/analytics/server"
import { isResponse, isSameOrigin, jsonError, userOrUnauthorized } from "@/lib/auth/api"
import { db } from "@/lib/db"
import { fulfilOrder, getEntitlements } from "@/lib/data/entitlements"
import type { OrderRow } from "@/lib/data/records"
import { verifyPaymentSignature } from "@/lib/payments/razorpay"

const Body = z.object({
  razorpay_order_id: z.string().min(5).max(64),
  razorpay_payment_id: z.string().min(5).max(64),
  razorpay_signature: z.string().min(10).max(256),
})

/** Called by the checkout handler. Grants access only after verifying Razorpay's signature. */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError(403, "forbidden", "Request blocked.")
  const user = await userOrUnauthorized()
  if (isResponse(user)) return user
  const parsed = Body.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return jsonError(400, "bad_request", "Payment details were incomplete.")
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data

  const order = await db().selectOne<OrderRow>("orders", { provider_order_id: razorpay_order_id })
  if (!order || order.user_id !== user.id) return jsonError(404, "unknown_order", "We couldn't find that order.")

  if (!verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
    return jsonError(400, "bad_signature", "We couldn't confirm this payment. If money was taken, it will be refunded automatically.")
  }

  const wasPaid = order.status === "paid"
  await fulfilOrder(order, razorpay_payment_id)
  if (!wasPaid) {
    await logEvent("paid", user.id, { product: order.product_key, amountRupees: getPlan(order.product_key as ProductKey).amountPaise / 100 })
  }
  return NextResponse.json({ ok: true, entitlements: await getEntitlements(user.id) })
}
