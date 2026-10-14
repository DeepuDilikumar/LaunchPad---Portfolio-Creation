import { bad } from "@/lib/http";
import { verifyWebhookSignature, type RazorpayWebhook } from "@/lib/razorpay";
import { handleWebhookEvent } from "@/lib/webhook";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Razorpay webhook: verify → dedupe by event id → mark paid → fulfil (stamp, email, CAPI).
 * Idempotent: the same event, or payment.captured and order.paid for one payment, deliver once.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return bad("Webhook secret not configured.", 500);
  if (!verifyWebhookSignature(raw, req.headers.get("x-razorpay-signature"), secret))
    return bad("Invalid signature.", 401);

  let event: RazorpayWebhook;
  try {
    event = JSON.parse(raw) as RazorpayWebhook;
  } catch {
    return bad("Invalid JSON.");
  }
  return handleWebhookEvent(event, req.headers.get("x-razorpay-event-id"));
}
