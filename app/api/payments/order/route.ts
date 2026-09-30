import { NextResponse } from "next/server"
import { z } from "zod"

import { CURRENCY, getPlan, type ProductKey } from "@/config/pricing"
import { logEvent } from "@/lib/analytics/server"
import { isResponse, isSameOrigin, jsonError, userOrUnauthorized } from "@/lib/auth/api"
import { db } from "@/lib/db"
import { getEntitlements, purchasableProducts } from "@/lib/data/entitlements"
import { getProfile } from "@/lib/data/profiles"
import type { OrderRow } from "@/lib/data/records"
import { isDemoMode, isRazorpayConfigured } from "@/lib/env"
import { createRazorpayOrder, publicKeyId } from "@/lib/payments/razorpay"

const Body = z.object({ product: z.enum(["report", "program", "bundle"]) })

/** Creates a Razorpay order. The amount always comes from config/pricing.ts, never the client. */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError(403, "forbidden", "Request blocked.")
  const user = await userOrUnauthorized()
  if (isResponse(user)) return user
  const parsed = Body.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return jsonError(400, "bad_request", "Unknown product.")
  const product = parsed.data.product as ProductKey

  const ent = await getEntitlements(user.id)
  if (!purchasableProducts(ent).includes(product)) {
    return jsonError(409, "already_owned", "You already have this. Refresh the page to see it.")
  }

  if (!isRazorpayConfigured()) {
    return isDemoMode()
      ? NextResponse.json({ mode: "demo" })
      : jsonError(503, "payments_unavailable", "Payments are temporarily unavailable. Please try again later.")
  }

  const plan = getPlan(product)
  try {
    const order = await createRazorpayOrder(plan.amountPaise, `lp_${Date.now()}`, { user_id: user.id, product })
    await db().insert<OrderRow>("orders", {
      user_id: user.id,
      product_key: product,
      amount_paise: plan.amountPaise,
      currency: CURRENCY,
      provider: "razorpay",
      provider_order_id: order.id,
      status: "created",
    })
    await logEvent("checkout_started", user.id, { product })
    const profile = await getProfile(user.id)
    return NextResponse.json({
      mode: "razorpay",
      keyId: publicKeyId(),
      orderId: order.id,
      amount: plan.amountPaise,
      currency: CURRENCY,
      name: "LaunchPad",
      description: plan.name,
      prefill: { name: profile?.data.fullName ?? user.name ?? "", email: user.email ?? profile?.data.email ?? "" },
    })
  } catch {
    return jsonError(502, "order_failed", "We couldn't start the payment. You haven't been charged. Please try again.")
  }
}
