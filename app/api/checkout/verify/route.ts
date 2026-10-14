import { fulfilOrder } from "@/lib/fulfil";
import { bad, json, readJson } from "@/lib/http";
import { applyPayment } from "@/lib/orders";
import { fetchPayment, verifyPaymentSignature } from "@/lib/razorpay";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Called by the checkout handler right after payment. The webhook does the same work; whichever
 * arrives first fulfils the order and the other is a no-op.
 */
export async function POST(req: Request) {
  const body = await readJson<{
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
  }>(req);
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!body?.razorpay_order_id || !body.razorpay_payment_id || !body.razorpay_signature || !secret)
    return bad("Bad request.");
  if (
    !verifyPaymentSignature(
      body.razorpay_order_id,
      body.razorpay_payment_id,
      body.razorpay_signature,
      secret,
    )
  ) {
    return bad("Signature mismatch.", 401);
  }
  const payment = await fetchPayment(body.razorpay_payment_id);
  if (payment.order_id !== body.razorpay_order_id) return bad("Payment does not match order.", 400);
  if (payment.status !== "captured") {
    // Not captured yet; the webhook will finish the job.
    return json({ status: "pending" });
  }
  const order = await applyPayment({
    razorpayOrderId: payment.order_id,
    paymentId: payment.id,
    amountPaise: payment.amount,
    email: payment.email,
    phone: payment.contact,
  });
  if (!order) return bad("Unknown order.", 404);
  const result = await fulfilOrder(order.id);
  return json({ orderId: order.id, status: result });
}
