import { getStore } from "@/lib/db";
import { bad, readJson } from "@/lib/http";
import { randomId } from "@/lib/ids";
import { handleWebhookEvent } from "@/lib/webhook";

export const dynamic = "force-dynamic";

/**
 * Development only: simulates Razorpay sending payment.captured for an order, so the whole
 * delivery pipeline can be tried without keys. Disabled in production.
 */
export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") return bad("Not found.", 404);
  const body = await readJson<{ orderId?: string; email?: string; repeat?: boolean }>(req);
  const order = body?.orderId ? await getStore().getOrder(body.orderId) : null;
  if (!order) return bad("Unknown order.", 404);
  const event = {
    event: "payment.captured",
    created_at: Math.floor(Date.now() / 1000),
    payload: {
      payment: {
        entity: {
          id: order.razorpay_payment_id ?? randomId("pay_dev"),
          order_id: order.razorpay_order_id,
          amount: order.amount,
          status: "captured",
          email: body?.email ?? order.email ?? undefined,
        },
      },
    },
  };
  const eventId = `evt_dev_${order.id}`;
  const first = await handleWebhookEvent(event, eventId);
  if (body?.repeat) await handleWebhookEvent(event, eventId);
  return first;
}
