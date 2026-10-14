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

interface Tables {
  orders: Map<string, Order>;
  events: Set<string>;
  links: Map<string, DownloadLink>;
  leads: Map<string, Lead>;
  quiz: QuizResult[];
  emails: Map<string, ScheduledEmail>;
  reviews: Map<string, Review>;
  referrals: Map<string, ReferralCode>;
  spend: AdSpend[];
  drills: Map<string, DrillSession>;
}

const clone = <T>(v: T): T => structuredClone(v);

/** In-process store for local development and tests. Not for production. */
export class MemoryStore implements Store {
  t: Tables = {
    orders: new Map(),
    events: new Set(),
    links: new Map(),
    leads: new Map(),
    quiz: [],
    emails: new Map(),
    reviews: new Map(),
    referrals: new Map(),
    spend: [],
    drills: new Map(),
  };

  async createOrder(o: Order) {
    this.t.orders.set(o.id, clone(o));
    return clone(o);
  }
  async getOrder(id: string) {
    const o = this.t.orders.get(id);
    return o ? clone(o) : null;
  }
  async getOrderByRazorpayId(rid: string) {
    const o = [...this.t.orders.values()].find((x) => x.razorpay_order_id === rid);
    return o ? clone(o) : null;
  }
  async updateOrder(id: string, patch: Partial<Order>) {
    const o = this.t.orders.get(id);
    if (!o) return null;
    Object.assign(o, patch);
    return clone(o);
  }
  async markOrderPaid(id: string, paymentId: string, email: string | null, phone: string | null) {
    const o = this.t.orders.get(id);
    if (!o) return null;
    if (o.status === "created") {
      Object.assign(o, {
        status: "paid",
        razorpay_payment_id: paymentId,
        paid_at: new Date().toISOString(),
        email: email ?? o.email,
        phone: phone ?? o.phone,
      });
    }
    return clone(o);
  }
  async claimFulfilment(id: string, lockMs: number) {
    const o = this.t.orders.get(id);
    const now = Date.now();
    if (!o || !(o.status === "paid" || o.status === "failed")) return null;
    if (o.lock_until && new Date(o.lock_until).getTime() > now) return null;
    o.lock_until = new Date(now + lockMs).toISOString();
    o.attempts += 1;
    return clone(o);
  }
  async listOrders(from: string, to: string) {
    return [...this.t.orders.values()]
      .filter((o) => o.created_at >= from && o.created_at < to)
      .map(clone);
  }
  async ordersDueForReviewAsk(paidBefore: string) {
    return [...this.t.orders.values()]
      .filter(
        (o) =>
          o.status === "fulfilled" && o.paid_at && o.paid_at < paidBefore && !o.review_ask_sent_at,
      )
      .map(clone);
  }
  async ordersByEmail(email: string) {
    return [...this.t.orders.values()].filter((o) => o.email === email).map(clone);
  }
  async ordersNeedingFulfilment(paidBefore: string) {
    const now = new Date().toISOString();
    return [...this.t.orders.values()]
      .filter(
        (o) =>
          (o.status === "paid" || o.status === "failed") &&
          o.paid_at &&
          o.paid_at < paidBefore &&
          o.attempts < 10 &&
          (!o.lock_until || o.lock_until < now),
      )
      .map(clone);
  }
  async recordWebhookEvent(eventId: string) {
    if (this.t.events.has(eventId)) return false;
    this.t.events.add(eventId);
    return true;
  }
  async createDownloadLink(l: DownloadLink) {
    this.t.links.set(l.token_hash, clone(l));
  }
  async getDownloadLink(h: string) {
    const l = this.t.links.get(h);
    return l ? clone(l) : null;
  }
  async consumeDownload(h: string, now: string) {
    const l = this.t.links.get(h);
    if (!l || l.expires_at <= now || l.downloads >= l.max_downloads) return null;
    l.downloads += 1;
    return clone(l);
  }
  async countDownloadLinksSince(orderId: string, since: string) {
    return [...this.t.links.values()].filter((l) => l.order_id === orderId && l.created_at >= since)
      .length;
  }
  async upsertLead(l: Omit<Lead, "id" | "created_at" | "unsubscribed_at">) {
    const existing = [...this.t.leads.values()].find((x) => x.email === l.email);
    if (existing) {
      Object.assign(existing, {
        consent_marketing: existing.consent_marketing || l.consent_marketing,
        segment: { ...existing.segment, ...l.segment },
      });
      return clone(existing);
    }
    const lead: Lead = {
      ...l,
      id: randomId("lead"),
      created_at: new Date().toISOString(),
      unsubscribed_at: null,
    };
    this.t.leads.set(lead.id, lead);
    return clone(lead);
  }
  async getLead(id: string) {
    const l = this.t.leads.get(id);
    return l ? clone(l) : null;
  }
  async unsubscribeLead(id: string) {
    const l = this.t.leads.get(id);
    if (l && !l.unsubscribed_at) l.unsubscribed_at = new Date().toISOString();
    for (const e of this.t.emails.values())
      if (e.lead_id === id && !e.sent_at) e.cancelled_at = new Date().toISOString();
  }
  async saveQuizResult(r: Omit<QuizResult, "id" | "created_at">) {
    const row = { ...r, id: randomId("quiz"), created_at: new Date().toISOString() };
    this.t.quiz.push(row);
    return clone(row);
  }
  async latestQuizResult(leadId: string) {
    const r = this.t.quiz
      .filter((q) => q.lead_id === leadId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
    return r ? clone(r) : null;
  }
  async countQuizResults(from: string, to: string) {
    return this.t.quiz.filter((q) => q.created_at >= from && q.created_at < to).length;
  }
  async countLeads(from: string, to: string) {
    return [...this.t.leads.values()].filter((l) => l.created_at >= from && l.created_at < to)
      .length;
  }
  async scheduleEmails(rows: Omit<ScheduledEmail, "id" | "sent_at" | "cancelled_at">[]) {
    for (const r of rows) {
      const dup = [...this.t.emails.values()].some(
        (e) => e.lead_id === r.lead_id && e.sequence === r.sequence && e.step === r.step,
      );
      if (dup) continue;
      const id = randomId("em");
      this.t.emails.set(id, { ...r, id, sent_at: null, cancelled_at: null });
    }
  }
  async dueEmails(now: string, limit: number) {
    return [...this.t.emails.values()]
      .filter((e) => !e.sent_at && !e.cancelled_at && e.send_at <= now)
      .sort((a, b) => a.send_at.localeCompare(b.send_at))
      .slice(0, limit)
      .map(clone);
  }
  async claimScheduledEmail(id: string) {
    const e = this.t.emails.get(id);
    if (!e || e.sent_at || e.cancelled_at) return false;
    e.sent_at = new Date().toISOString();
    return true;
  }
  async createReview(r: Review) {
    this.t.reviews.set(r.id, clone(r));
    return clone(r);
  }
  async listReviews(status?: ReviewStatus) {
    return [...this.t.reviews.values()]
      .filter((r) => !status || r.status === status)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map(clone);
  }
  async setReviewStatus(id: string, status: ReviewStatus) {
    const r = this.t.reviews.get(id);
    if (r) r.status = status;
  }
  async reviewForOrder(orderId: string) {
    const r = [...this.t.reviews.values()].find((x) => x.order_id === orderId);
    return r ? clone(r) : null;
  }
  async createReferralCode(r: ReferralCode) {
    this.t.referrals.set(r.code, clone(r));
    return clone(r);
  }
  async getReferralCode(code: string) {
    const r = this.t.referrals.get(code);
    return r ? clone(r) : null;
  }
  async referralCodeForOrder(orderId: string) {
    const r = [...this.t.referrals.values()].find((x) => x.order_id === orderId);
    return r ? clone(r) : null;
  }
  async addAdSpend(a: Omit<AdSpend, "id">) {
    const row = { ...a, id: randomId("ad") };
    this.t.spend.push(row);
    return clone(row);
  }
  async listAdSpend(from: string, to: string) {
    return this.t.spend.filter((s) => s.date >= from && s.date < to).map(clone);
  }
  async createDrillSession(s: DrillSession) {
    this.t.drills.set(s.id, clone(s));
    return clone(s);
  }
  async getDrillSession(id: string) {
    const s = this.t.drills.get(id);
    return s ? clone(s) : null;
  }
  async updateDrillSession(id: string, patch: Partial<DrillSession>) {
    const s = this.t.drills.get(id);
    if (s) Object.assign(s, patch);
  }
  async countDrillSessionsSince(email: string, since: string) {
    return [...this.t.drills.values()].filter((s) => s.email === email && s.created_at >= since)
      .length;
  }
  async drillCostSince(since: string) {
    return [...this.t.drills.values()]
      .filter((s) => s.created_at >= since)
      .reduce((n, s) => n + s.cost_usd, 0);
  }
}
