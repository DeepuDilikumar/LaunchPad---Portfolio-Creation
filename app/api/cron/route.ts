import { alertOwner } from "@/lib/alert";
import { getStore } from "@/lib/db";
import { fulfilOrder } from "@/lib/fulfil";
import { bad, json } from "@/lib/http";
import { REVIEW_ASK_DAYS, sendReviewAsk } from "@/lib/reviews";
import { sendSequenceStep } from "@/lib/sequence";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Hourly (vercel.json). Sends due sequence emails, day-7 review asks, and retries any paid
 * order that hasn't been delivered (for example after a function timeout).
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`)
    return bad("Unauthorized.", 401);
  const store = getStore();
  const now = new Date();
  const report = { sequence: 0, reviewAsks: 0, swept: 0, errors: 0 };

  for (const row of await store.dueEmails(now.toISOString(), 200)) {
    const lead = await store.getLead(row.lead_id);
    if (!lead) continue;
    if (!(await store.claimScheduledEmail(row.id))) continue;
    try {
      if (await sendSequenceStep(row, lead)) report.sequence++;
    } catch (err) {
      report.errors++;
      console.error("sequence email failed", row.id, err);
    }
  }

  const reviewBefore = new Date(now.getTime() - REVIEW_ASK_DAYS * 86400_000).toISOString();
  for (const order of await store.ordersDueForReviewAsk(reviewBefore)) {
    try {
      await sendReviewAsk(order);
      await store.updateOrder(order.id, { review_ask_sent_at: now.toISOString() });
      report.reviewAsks++;
    } catch (err) {
      report.errors++;
      console.error("review ask failed", order.id, err);
    }
  }

  const sweepBefore = new Date(now.getTime() - 5 * 60_000).toISOString();
  for (const order of await store.ordersNeedingFulfilment(sweepBefore)) {
    const result = await fulfilOrder(order.id, { backoffMs: 500 });
    if (result === "fulfilled") report.swept++;
  }

  if (report.errors > 5) await alertOwner("Cron run had errors", report);
  return json(report);
}
