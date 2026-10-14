import { site } from "@/config/site";
import { SimpleEmail } from "@/emails/SimpleEmail";
import { getStore } from "@/lib/db";
import { renderEmail } from "@/lib/email/render";
import { getMailer } from "@/lib/email/send";
import { bad, json, readJson } from "@/lib/http";
import { randomId, verifyToken } from "@/lib/ids";
import { getOrCreateReferralCode, referralUrl } from "@/lib/reviews";

export const dynamic = "force-dynamic";

const YEARS = ["2–4", "4–8", "8+", "0–2"];

/** Saves a buyer's review as pending; it's published only after moderation. */
export async function POST(req: Request) {
  const body = await readJson<{
    t?: string;
    name?: string;
    role?: string;
    years?: string;
    rating?: number;
    body?: string;
    consent?: boolean;
  }>(req);
  const payload = body?.t ? verifyToken<{ o: string }>(body.t) : null;
  if (!payload?.o)
    return bad("This review link isn't valid. Reply to the email and we'll send a new one.", 401);
  const store = getStore();
  const order = await store.getOrder(payload.o);
  if (!order || order.status !== "fulfilled") return bad("Order not found.", 404);
  if (await store.reviewForOrder(order.id))
    return bad("You've already left a review for this order. Thank you!", 409);

  const name = body?.name?.trim().slice(0, 60) ?? "";
  const role = body?.role?.trim().slice(0, 80) ?? "";
  const text = body?.body?.trim().slice(0, 1200) ?? "";
  const rating = Number(body?.rating);
  if (
    !name ||
    !role ||
    text.length < 20 ||
    !YEARS.includes(body?.years ?? "") ||
    !(rating >= 1 && rating <= 5)
  ) {
    return bad("Please fill in every field (the review needs at least 20 characters).");
  }

  await store.createReview({
    id: randomId("rev"),
    order_id: order.id,
    product_slug: order.product_slug,
    name,
    role,
    years: body!.years!,
    rating: Math.round(rating),
    body: text,
    consent_publish: body?.consent === true,
    status: "pending",
    created_at: new Date().toISOString(),
  });

  if (!site.referral.enabled) return json({ ok: true });
  const code = await getOrCreateReferralCode(order);
  const url = referralUrl(code);
  if (order.email) {
    const { html, text: plain } = await renderEmail(
      SimpleEmail({
        preview: "Your referral link",
        heading: "Thanks for the review. Here's your link.",
        paragraphs: [
          `Share this link with a friend who's switching: they get ₹${site.referral.friendDiscount} off, and you get ₹${site.referral.buyerReward} back when they buy.`,
          url,
        ],
      }),
    );
    await getMailer().send({
      to: order.email,
      subject: "Your referral link",
      html,
      text: plain,
      idempotencyKey: `referral-${order.id}`,
    });
  }
  return json({ ok: true, referralUrl: url, code });
}
