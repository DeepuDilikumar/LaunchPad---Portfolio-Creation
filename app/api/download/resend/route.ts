import { getStore } from "@/lib/db";
import { sendDeliveryEmail } from "@/lib/delivery";
import { bad, json, readJson } from "@/lib/http";
import { normaliseEmail } from "@/lib/ids";

export const dynamic = "force-dynamic";

const PER_DAY = 5;

/** Sends a fresh link, only to the email on the order. */
export async function POST(req: Request) {
  const body = await readJson<{ orderId?: string; email?: string }>(req);
  if (!body?.orderId || !body.email) return bad("Order and email are required.");
  const store = getStore();
  const order = await store.getOrder(body.orderId);
  // Same reply whether or not it matched, so this can't be used to probe orders.
  const done = json({ ok: true, message: "If that matches your order, a new link is on its way." });
  if (!order || order.status !== "fulfilled" || order.email !== normaliseEmail(body.email))
    return done;
  const since = new Date(Date.now() - 24 * 3600_000).toISOString();
  if ((await store.countDownloadLinksSince(order.id, since)) >= PER_DAY) {
    return bad("Too many links today. Reply to your delivery email and we'll sort it out.", 429);
  }
  await sendDeliveryEmail(order, { resent: true });
  return done;
}
