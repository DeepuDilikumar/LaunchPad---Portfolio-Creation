import { getProduct, site } from "@/config/site";
import { getStore, type Order } from "./db";
import { DeliveryEmail } from "@/emails/DeliveryEmail";
import { getMailer } from "./email/send";
import { renderEmail } from "./email/render";
import { randomToken, sha256 } from "./ids";

export const editionsList = ["a4", "phone"] as const;
export type EditionKey = (typeof editionsList)[number];

/** Guides a product delivers that actually have files (a coming-soon guide in a bundle is skipped). */
export function deliverableGuides(productSlug: string): string[] {
  const product = getProduct(productSlug);
  if (!product) throw new Error(`unknown product ${productSlug}`);
  return product.guides;
}

export function fileId(guide: string, edition: EditionKey): string {
  return `${guide}-${edition}`;
}

export function parseFileId(id: string): { guide: string; edition: EditionKey } | null {
  const m = id.match(/^([a-z0-9-]+)-(a4|phone)$/);
  return m ? { guide: m[1], edition: m[2] as EditionKey } : null;
}

export function guideTitle(guide: string): string {
  const fromProduct = getProduct(guide)?.name;
  if (fromProduct) return fromProduct;
  return guide.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Creates a fresh 24-hour download link for an order and returns the raw token. */
export async function createDownloadLink(orderId: string): Promise<string> {
  const token = randomToken();
  const now = new Date();
  await getStore().createDownloadLink({
    token_hash: sha256(token),
    order_id: orderId,
    expires_at: new Date(now.getTime() + site.delivery.linkHours * 3600_000).toISOString(),
    max_downloads: site.delivery.maxDownloads,
    downloads: 0,
    created_at: now.toISOString(),
  });
  return token;
}

export function downloadPageUrl(token: string): string {
  return `${site.url}/download?t=${encodeURIComponent(token)}`;
}

export function thankYouUrl(orderId: string): string {
  return `${site.url}/thank-you?order=${encodeURIComponent(orderId)}`;
}

/** Sends the delivery email with a new link. `idempotencyKey` makes the provider send it once. */
export async function sendDeliveryEmail(
  order: Order,
  opts: { resent?: boolean; idempotencyKey?: string } = {},
) {
  if (!order.email) throw new Error(`order ${order.id} has no email`);
  const product = getProduct(order.product_slug)!;
  const token = await createDownloadLink(order.id);
  const url = downloadPageUrl(token);
  const { html, text } = await renderEmail(
    DeliveryEmail({
      orderId: order.id,
      productName: product.name,
      amountInr: order.amount / 100,
      downloads: [{ label: "Download your guide", url }],
      thankYouUrl: thankYouUrl(order.id),
      resent: opts.resent,
    }),
  );
  await getMailer().send({
    to: order.email,
    subject: opts.resent ? `New download link: ${product.name}` : `Your ${product.name} is ready`,
    html,
    text,
    idempotencyKey: opts.idempotencyKey,
    tags: [{ name: "type", value: opts.resent ? "resend" : "delivery" }],
  });
}

export function maskEmail(email: string | null): string | null {
  if (!email) return null;
  const [user, domain] = email.split("@");
  if (!domain) return null;
  return `${user.slice(0, 2)}${"•".repeat(Math.max(1, Math.min(6, user.length - 2)))}@${domain}`;
}
