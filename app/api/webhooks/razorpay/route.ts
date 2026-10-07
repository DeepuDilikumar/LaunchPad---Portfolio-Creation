import { razorpay } from "@/lib/payments/razorpay";
import { handleWebhook } from "@/lib/payments";
import { mock } from "@/lib/env";

export async function POST(req: Request) {
  if (mock.payments) return new Response("Payments are not configured", { status: 404 });
  const raw = await req.text();
  if (raw.length > 1_000_000) return new Response("Too large", { status: 413 });
  const event = razorpay.parseWebhook(raw, req.headers);
  if (!event) return new Response("Invalid signature", { status: 400 });
  const r = await handleWebhook("razorpay", event);
  // 200 for processed and duplicate events; 500 asks Razorpay to retry a failed one.
  return Response.json(r, { status: r.error ? 500 : 200 });
}
