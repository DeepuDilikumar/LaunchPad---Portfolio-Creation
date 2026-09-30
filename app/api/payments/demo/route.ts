import { NextResponse } from "next/server"
import { z } from "zod"

import { CURRENCY, getPlan, type ProductKey } from "@/config/pricing"
import { logEvent } from "@/lib/analytics/server"
import { isResponse, isSameOrigin, jsonError, userOrUnauthorized } from "@/lib/auth/api"
import { db } from "@/lib/db"
import { fulfilOrder, getEntitlements, purchasableProducts } from "@/lib/data/entitlements"
import type { OrderRow } from "@/lib/data/records"
import { isDemoMode, isRazorpayConfigured } from "@/lib/env"

const Body = z.object({ product: z.enum(["report", "program", "bundle"]) })

/** Demo mode only: a clearly labelled test payment that unlocks without charging anything. */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError(403, "forbidden", "Request blocked.")
  if (!isDemoMode() || isRazorpayConfigured()) return jsonError(404, "not_found", "Not available.")
  const user = await userOrUnauthorized()
  if (isResponse(user)) return user
  const parsed = Body.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return jsonError(400, "bad_request", "Unknown product.")
  const product = parsed.data.product as ProductKey
  if (!purchasableProducts(await getEntitlements(user.id)).includes(product)) {
    return jsonError(409, "already_owned", "You already have this.")
  }
  const order = await db().insert<OrderRow>("orders", {
    user_id: user.id,
    product_key: product,
    amount_paise: getPlan(product).amountPaise,
    currency: CURRENCY,
    provider: "demo",
    provider_order_id: `demo_${crypto.randomUUID()}`,
    status: "created",
  })
  await fulfilOrder(order, `demo_pay_${Date.now()}`)
  await logEvent("paid", user.id, { product, demo: true })
  return NextResponse.json({ ok: true, entitlements: await getEntitlements(user.id) })
}
