import { NextResponse } from "next/server"

import { logEvent } from "@/lib/analytics/server"
import { db } from "@/lib/db"
import { fulfilOrder } from "@/lib/data/entitlements"
import type { OrderRow } from "@/lib/data/records"
import { verifyWebhookSignature } from "@/lib/payments/razorpay"

type RazorpayEvent = {
  event: string
  payload?: {
    payment?: { entity?: { id: string; order_id: string; status: string } }
    order?: { entity?: { id: string } }
  }
}

/**
 * Razorpay webhook (payment.captured / order.paid). Verifies the signature on the raw body,
 * de-duplicates by event id, and fulfils idempotently, so it's safe if it arrives before
 * the checkout redirect, after it, or more than once.
 */
export async function POST(request: Request) {
  const raw = await request.text()
  const signature = request.headers.get("x-razorpay-signature") ?? ""
  if (!verifyWebhookSignature(raw, signature)) return new NextResponse("invalid signature", { status: 400 })

  let event: RazorpayEvent
  try {
    event = JSON.parse(raw) as RazorpayEvent
  } catch {
    return new NextResponse("bad payload", { status: 400 })
  }

  const eventId = request.headers.get("x-razorpay-event-id")
  if (eventId && (await db().selectOne("razorpay_webhook_events", { event_id: eventId }))) {
    return NextResponse.json({ ok: true, duplicate: true })
  }
  // Recorded only after successful processing, so a failed attempt is retried by Razorpay.
  const markSeen = async () => {
    if (eventId) await db().upsert("razorpay_webhook_events", { event_id: eventId, type: event.event }, ["event_id"])
  }

  if (event.event !== "payment.captured" && event.event !== "order.paid") {
    await markSeen()
    return NextResponse.json({ ok: true, ignored: true })
  }

  const payment = event.payload?.payment?.entity
  const orderId = payment?.order_id ?? event.payload?.order?.entity?.id
  if (!orderId) return NextResponse.json({ ok: true, ignored: true })

  const order = await db().selectOne<OrderRow>("orders", { provider_order_id: orderId })
  // Unknown order, or the account was deleted (orders are kept anonymised): nothing to unlock.
  if (!order || !order.user_id) {
    await markSeen()
    return NextResponse.json({ ok: true, unknown_order: true })
  }

  const wasPaid = order.status === "paid"
  await fulfilOrder(order, payment?.id ?? null)
  if (!wasPaid) await logEvent("paid", order.user_id, { product: order.product_key, via: "webhook" })
  await markSeen()
  return NextResponse.json({ ok: true })
}
