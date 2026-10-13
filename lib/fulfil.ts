import { getProduct } from "@/config/site";
import { alertOwner } from "./alert";
import { sendMetaPurchase } from "./analytics";
import { getStore, type Order } from "./db";
import { deliverableGuides, editionsList, sendDeliveryEmail } from "./delivery";
import { stampPdf } from "./stamp";
import { getStorage, masterKey, stampedKey } from "./storage";

export const MAX_ATTEMPTS = 3;
const LOCK_MS = 2 * 60_000;

export type FulfilResult = "fulfilled" | "skipped" | "failed";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Stamps every file the order needs. Already-stamped files are reused, so a retry is cheap. */
async function stampAll(order: Order): Promise<void> {
  const storage = getStorage();
  for (const guide of deliverableGuides(order.product_slug)) {
    for (const edition of editionsList) {
      const key = stampedKey(order.id, guide, edition);
      if (await storage.exists(key)) continue;
      const master = await storage.get(masterKey(guide, edition));
      if (!master) throw new Error(`master PDF missing: ${masterKey(guide, edition)}`);
      const stamped = await stampPdf(master, {
        email: order.email ?? "unknown",
        orderId: order.id,
      });
      await storage.put(key, stamped, "application/pdf");
    }
  }
}

async function fulfilOnce(order: Order): Promise<void> {
  const store = getStore();
  if (!order.email) throw new Error("no buyer email on the order");
  await stampAll(order);

  if (!order.delivery_email_sent_at) {
    await sendDeliveryEmail(order, { idempotencyKey: `delivery-${order.id}` });
    await store.updateOrder(order.id, { delivery_email_sent_at: new Date().toISOString() });
  }

  if (!order.capi_sent_at) {
    try {
      const sent = await sendMetaPurchase({
        orderId: order.id,
        email: order.email,
        phone: order.phone,
        valueInr: order.amount / 100,
        productSlug: order.product_slug,
        eventTime: new Date(order.paid_at ?? Date.now()),
      });
      if (sent) await store.updateOrder(order.id, { capi_sent_at: new Date().toISOString() });
    } catch (err) {
      // Tracking must never block delivery.
      console.error("meta capi failed", err);
    }
  }

  await store.updateOrder(order.id, {
    status: "fulfilled",
    fulfilled_at: new Date().toISOString(),
    lock_until: null,
    last_error: null,
  });
}

/**
 * Everything after payment. Safe to call any number of times, from the webhook, the checkout
 * verify call or the cron sweeper: the lock means one worker at a time, and the buyer gets one
 * delivery email. Retries 3 times, then alerts the owner.
 */
export async function fulfilOrder(
  orderId: string,
  opts: { backoffMs?: number } = {},
): Promise<FulfilResult> {
  const store = getStore();
  const backoff = opts.backoffMs ?? 1000;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const order = await store.claimFulfilment(orderId, LOCK_MS);
    if (!order) return attempt === 1 ? "skipped" : "failed";
    try {
      await fulfilOnce(order);
      return "fulfilled";
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await store.updateOrder(orderId, { status: "failed", lock_until: null, last_error: message });
      if (attempt === MAX_ATTEMPTS) {
        await alertOwner(
          "Delivery failed after 3 attempts",
          {
            orderId,
            product: getProduct(order.product_slug)?.name,
            email: order.email,
            error: message,
          },
          err,
        );
        return "failed";
      }
      await sleep(backoff * 2 ** (attempt - 1));
    }
  }
  return "failed";
}
