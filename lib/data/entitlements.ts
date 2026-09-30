import "server-only"

import { getPlan, type Entitlement, type ProductKey } from "@/config/pricing"
import { db } from "@/lib/db"
import type { EntitlementRow, OrderRow } from "./records"

export type Entitlements = { report: boolean; program: boolean }

export async function getEntitlements(userId: string): Promise<Entitlements> {
  const rows = await db().select<EntitlementRow>("entitlements", { user_id: userId })
  const has = (e: Entitlement) => rows.some((r) => r.entitlement === e)
  return { report: has("report"), program: has("program") }
}

/**
 * Marks an order paid and grants its entitlements. Idempotent: safe to call from both the
 * checkout verification and the webhook, in either order, any number of times.
 */
export async function fulfilOrder(order: OrderRow, paymentId: string | null) {
  if (order.status !== "paid") {
    await db().update<OrderRow>(
      "orders",
      { id: order.id },
      { status: "paid", provider_payment_id: paymentId, paid_at: new Date().toISOString() }
    )
  }
  const plan = getPlan(order.product_key as ProductKey)
  for (const entitlement of plan.entitlements) {
    await db().upsert<EntitlementRow>(
      "entitlements",
      { user_id: order.user_id, entitlement, order_id: order.id, granted_at: new Date().toISOString() },
      ["user_id", "entitlement"]
    )
  }
}

/** Which products still make sense to sell to this user (never charge twice for the same thing). */
export function purchasableProducts(ent: Entitlements): ProductKey[] {
  const out: ProductKey[] = []
  if (!ent.report) out.push("report")
  if (!ent.program) out.push("program")
  if (!ent.report && !ent.program) out.push("bundle")
  return out
}
