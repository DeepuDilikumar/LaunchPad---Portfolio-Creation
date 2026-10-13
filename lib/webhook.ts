import { alertOwner } from "./alert";
import { getStore } from "./db";
import { fulfilOrder } from "./fulfil";
import { json } from "./http";
import { applyPayment } from "./orders";
import type { RazorpayWebhook } from "./razorpay";

export async function handleWebhookEvent(event: RazorpayWebhook, eventIdHeader: string | null) {
  const payment = event.payload.payment?.entity;
  const eventId =
    eventIdHeader ??
    `${event.event}:${payment?.id ?? event.payload.order?.entity.id}:${event.created_at}`;
  const fresh = await getStore().recordWebhookEvent(eventId, event.event);
  if (!fresh) return json({ ok: true, duplicate: true });

  if ((event.event === "payment.captured" || event.event === "order.paid") && payment) {
    try {
      const order = await applyPayment({
        razorpayOrderId: payment.order_id,
        paymentId: payment.id,
        amountPaise: payment.amount,
        email: payment.email,
        phone: payment.contact,
      });
      if (!order) return json({ ok: true, ignored: "unknown order" });
      const result = await fulfilOrder(order.id);
      return json({ ok: true, orderId: order.id, result });
    } catch (err) {
      await alertOwner(
        "Webhook could not apply a payment",
        { eventId, event: event.event, paymentId: payment.id },
        err,
      );
      // 200 so Razorpay doesn't retry into the dedupe; the cron sweeper and the alert cover it.
      return json({ ok: false });
    }
  }
  return json({ ok: true, ignored: event.event });
}
