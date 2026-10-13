import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomId } from "../ids";
import type {
  AdSpend,
  DownloadLink,
  DrillSession,
  Lead,
  Order,
  QuizResult,
  ReferralCode,
  Review,
  ReviewStatus,
  ScheduledEmail,
  Store,
} from "./types";

function must<T>(res: { data: T | null; error: { message: string; code?: string } | null }): T {
  if (res.error) throw new Error(`supabase: ${res.error.message}`);
  return res.data as T;
}

export class SupabaseStore implements Store {
  db: SupabaseClient;
  constructor(url: string, serviceKey: string) {
    this.db = createClient(url, serviceKey, { auth: { persistSession: false } });
  }

  async createOrder(o: Order) {
    return must(await this.db.from("orders").insert(o).select().single()) as Order;
  }
  async getOrder(id: string) {
    return must(await this.db.from("orders").select().eq("id", id).maybeSingle()) as Order | null;
  }
  async getOrderByRazorpayId(rid: string) {
    return must(
      await this.db.from("orders").select().eq("razorpay_order_id", rid).maybeSingle(),
    ) as Order | null;
  }
  async updateOrder(id: string, patch: Partial<Order>) {
    return must(
      await this.db.from("orders").update(patch).eq("id", id).select().maybeSingle(),
    ) as Order | null;
  }
  async markOrderPaid(id: string, paymentId: string, email: string | null, phone: string | null) {
    const patch: Partial<Order> = {
      status: "paid",
      razorpay_payment_id: paymentId,
      paid_at: new Date().toISOString(),
    };
    if (email) patch.email = email;
    if (phone) patch.phone = phone;
    must(await this.db.from("orders").update(patch).eq("id", id).eq("status", "created").select());
    return this.getOrder(id);
  }
  async claimFulfilment(id: string, lockMs: number) {
    const rows = must(
      await this.db.rpc("claim_fulfilment", { p_id: id, p_lock_ms: lockMs }),
    ) as Order[];
    return rows[0] ?? null;
  }
  async listOrders(from: string, to: string) {
    return must(
      await this.db.from("orders").select().gte("created_at", from).lt("created_at", to),
    ) as Order[];
  }
  async ordersDueForReviewAsk(paidBefore: string) {
    return must(
      await this.db
        .from("orders")
        .select()
        .eq("status", "fulfilled")
        .lt("paid_at", paidBefore)
        .is("review_ask_sent_at", null)
        .limit(200),
    ) as Order[];
  }
  async ordersByEmail(email: string) {
    return must(
      await this.db
        .from("orders")
        .select()
        .eq("email", email)
        .order("created_at", { ascending: false }),
    ) as Order[];
  }
  async ordersNeedingFulfilment(paidBefore: string) {
    const now = new Date().toISOString();
    return must(
      await this.db
        .from("orders")
        .select()
        .in("status", ["paid", "failed"])
        .lt("paid_at", paidBefore)
        .or(`lock_until.is.null,lock_until.lt.${now}`)
        .lt("attempts", 10)
        .limit(50),
    ) as Order[];
  }
  async recordWebhookEvent(eventId: string, type: string) {
    const res = await this.db.from("webhook_events").insert({ event_id: eventId, type });
    if (res.error?.code === "23505") return false;
    if (res.error) throw new Error(`supabase: ${res.error.message}`);
    return true;
  }
  async createDownloadLink(l: DownloadLink) {
    must(await this.db.from("download_links").insert(l));
  }
  async getDownloadLink(h: string) {
    return must(
      await this.db.from("download_links").select().eq("token_hash", h).maybeSingle(),
    ) as DownloadLink | null;
  }
  async consumeDownload(h: string, now: string) {
    const rows = must(
      await this.db.rpc("consume_download", { p_token_hash: h, p_now: now }),
    ) as DownloadLink[];
    return rows[0] ?? null;
  }
  async countDownloadLinksSince(orderId: string, since: string) {
    const res = await this.db
      .from("download_links")
      .select("token_hash", { count: "exact", head: true })
      .eq("order_id", orderId)
      .gte("created_at", since);
    if (res.error) throw new Error(`supabase: ${res.error.message}`);
    return res.count ?? 0;
  }
  async upsertLead(l: Omit<Lead, "id" | "created_at" | "unsubscribed_at">) {
    const existing = must(
      await this.db.from("leads").select().eq("email", l.email).maybeSingle(),
    ) as Lead | null;
    if (existing) {
      return must(
        await this.db
          .from("leads")
          .update({
            consent_marketing: existing.consent_marketing || l.consent_marketing,
            segment: { ...existing.segment, ...l.segment },
          })
          .eq("id", existing.id)
          .select()
          .single(),
      ) as Lead;
    }
    return must(
      await this.db
        .from("leads")
        .insert({ ...l, id: randomId("lead") })
        .select()
        .single(),
    ) as Lead;
  }
  async getLead(id: string) {
    return must(await this.db.from("leads").select().eq("id", id).maybeSingle()) as Lead | null;
  }
  async unsubscribeLead(id: string) {
    const now = new Date().toISOString();
    must(
      await this.db
        .from("leads")
        .update({ unsubscribed_at: now })
        .eq("id", id)
        .is("unsubscribed_at", null),
    );
    must(
      await this.db
        .from("scheduled_emails")
        .update({ cancelled_at: now })
        .eq("lead_id", id)
        .is("sent_at", null),
    );
  }
  async saveQuizResult(r: Omit<QuizResult, "id" | "created_at">) {
    return must(
      await this.db
        .from("quiz_results")
        .insert({ ...r, id: randomId("quiz") })
        .select()
        .single(),
    ) as QuizResult;
  }
  async latestQuizResult(leadId: string) {
    return must(
      await this.db
        .from("quiz_results")
        .select()
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ) as QuizResult | null;
  }
  private async count(table: string, from: string, to: string) {
    const res = await this.db
      .from(table)
      .select("id", { count: "exact", head: true })
      .gte("created_at", from)
      .lt("created_at", to);
    if (res.error) throw new Error(`supabase: ${res.error.message}`);
    return res.count ?? 0;
  }
  async countQuizResults(from: string, to: string) {
    return this.count("quiz_results", from, to);
  }
  async countLeads(from: string, to: string) {
    return this.count("leads", from, to);
  }
  async scheduleEmails(rows: Omit<ScheduledEmail, "id" | "sent_at" | "cancelled_at">[]) {
    if (!rows.length) return;
    must(
      await this.db.from("scheduled_emails").upsert(
        rows.map((r) => ({ ...r, id: randomId("em") })),
        {
          onConflict: "lead_id,sequence,step",
          ignoreDuplicates: true,
        },
      ),
    );
  }
  async dueEmails(now: string, limit: number) {
    return must(
      await this.db
        .from("scheduled_emails")
        .select()
        .is("sent_at", null)
        .is("cancelled_at", null)
        .lte("send_at", now)
        .order("send_at")
        .limit(limit),
    ) as ScheduledEmail[];
  }
  async claimScheduledEmail(id: string) {
    const rows = must(
      await this.db
        .from("scheduled_emails")
        .update({ sent_at: new Date().toISOString() })
        .eq("id", id)
        .is("sent_at", null)
        .is("cancelled_at", null)
        .select(),
    ) as ScheduledEmail[];
    return rows.length === 1;
  }
  async createReview(r: Review) {
    return must(await this.db.from("reviews").insert(r).select().single()) as Review;
  }
  async listReviews(status?: ReviewStatus) {
    let q = this.db.from("reviews").select().order("created_at", { ascending: false });
    if (status) q = q.eq("status", status);
    return must(await q) as Review[];
  }
  async setReviewStatus(id: string, status: ReviewStatus) {
    must(await this.db.from("reviews").update({ status }).eq("id", id));
  }
  async reviewForOrder(orderId: string) {
    return must(
      await this.db.from("reviews").select().eq("order_id", orderId).maybeSingle(),
    ) as Review | null;
  }
  async createReferralCode(r: ReferralCode) {
    return must(await this.db.from("referral_codes").insert(r).select().single()) as ReferralCode;
  }
  async getReferralCode(code: string) {
    return must(
      await this.db.from("referral_codes").select().eq("code", code).maybeSingle(),
    ) as ReferralCode | null;
  }
  async referralCodeForOrder(orderId: string) {
    return must(
      await this.db.from("referral_codes").select().eq("order_id", orderId).maybeSingle(),
    ) as ReferralCode | null;
  }
  async addAdSpend(a: Omit<AdSpend, "id">) {
    return must(
      await this.db
        .from("ad_spend")
        .insert({ ...a, id: randomId("ad") })
        .select()
        .single(),
    ) as AdSpend;
  }
  async listAdSpend(from: string, to: string) {
    return must(
      await this.db.from("ad_spend").select().gte("date", from).lt("date", to),
    ) as AdSpend[];
  }
  async createDrillSession(s: DrillSession) {
    return must(await this.db.from("drill_sessions").insert(s).select().single()) as DrillSession;
  }
  async getDrillSession(id: string) {
    return must(
      await this.db.from("drill_sessions").select().eq("id", id).maybeSingle(),
    ) as DrillSession | null;
  }
  async updateDrillSession(id: string, patch: Partial<DrillSession>) {
    must(await this.db.from("drill_sessions").update(patch).eq("id", id));
  }
  async countDrillSessionsSince(email: string, since: string) {
    const res = await this.db
      .from("drill_sessions")
      .select("id", { count: "exact", head: true })
      .eq("email", email)
      .gte("created_at", since);
    if (res.error) throw new Error(`supabase: ${res.error.message}`);
    return res.count ?? 0;
  }
  async drillCostSince(since: string) {
    const rows = must(
      await this.db.from("drill_sessions").select("cost_usd").gte("created_at", since),
    ) as { cost_usd: number }[];
    return rows.reduce((n, r) => n + Number(r.cost_usd), 0);
  }
}
