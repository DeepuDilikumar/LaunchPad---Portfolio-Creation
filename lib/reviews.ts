import { getProduct, site } from "@/config/site";
import { SimpleEmail } from "@/emails/SimpleEmail";
import { getStore, type Order, type Review } from "./db";
import { renderEmail } from "./email/render";
import { getMailer } from "./email/send";
import { randomBytes } from "node:crypto";
import { signToken } from "./ids";

export const REVIEW_ASK_DAYS = 7;

export function reviewUrl(orderId: string): string {
  const exp = Date.now() + 60 * 86400_000;
  return `${site.url}/review?t=${encodeURIComponent(signToken({ o: orderId, exp }))}`;
}

export function referralUrl(code: string): string {
  return `${site.url}/guides/backend?ref=${encodeURIComponent(code)}`;
}

/** Published reviews for the site. Empty (never invented) when there are none or no database. */
export async function publishedReviews(productSlug?: string): Promise<Review[]> {
  try {
    const all = await getStore().listReviews("published");
    return all.filter((r) => r.consent_publish && (!productSlug || r.product_slug === productSlug));
  } catch (err) {
    console.error("could not load reviews", err);
    return [];
  }
}

export async function sendReviewAsk(order: Order): Promise<void> {
  if (!order.email) return;
  const product = getProduct(order.product_slug);
  const { html, text } = await renderEmail(
    SimpleEmail({
      preview: "Two minutes: did the guide help?",
      heading: "Did the guide help?",
      paragraphs: [
        `It's been a week since you got the ${product?.name ?? "guide"}. Did it help with your prep?`,
        "A short, honest review helps other engineers decide, and it tells me what to fix. It takes two minutes.",
        site.referral.enabled
          ? `After you leave it, you get a link to share: your friend gets ₹${site.referral.friendDiscount} off, and you get ₹${site.referral.buyerReward} back when they buy.`
          : "",
      ].filter(Boolean),
      cta: { label: "Leave a review", url: reviewUrl(order.id) },
    }),
  );
  await getMailer().send({
    to: order.email,
    subject: "Did the guide help?",
    html,
    text,
    idempotencyKey: `review-ask-${order.id}`,
  });
}

export async function getOrCreateReferralCode(order: Order): Promise<string> {
  const store = getStore();
  const existing = await store.referralCodeForOrder(order.id);
  if (existing) return existing.code;
  for (let i = 0; i < 5; i++) {
    const code = `${site.author.name.slice(0, 4).toUpperCase()}-${randomBytes(3).toString("hex").toUpperCase()}`;
    if (await store.getReferralCode(code)) continue;
    await store.createReferralCode({
      code,
      order_id: order.id,
      email: order.email ?? "",
      created_at: new Date().toISOString(),
    });
    return code;
  }
  throw new Error("could not create a referral code");
}
