import { mockProvider } from "@/lib/payments/mock";
import { handleWebhook } from "@/lib/payments";
import { mockEndpointsEnabled } from "@/lib/env";

/** Same pipeline as the Razorpay webhook, signed with the local mock secret. Non-production only. */
export async function POST(req: Request) {
  if (!mockEndpointsEnabled("payments")) return new Response("Not found", { status: 404 });
  const raw = await req.text();
  const event = mockProvider.parseWebhook(raw, req.headers);
  if (!event) return new Response("Invalid signature", { status: 400 });
  const r = await handleWebhook("mock", event);
  return Response.json(r, { status: r.error ? 500 : 200 });
}
