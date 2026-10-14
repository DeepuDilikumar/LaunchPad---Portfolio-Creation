export type OrderStatus = "created" | "paid" | "fulfilled" | "failed" | "refunded";

export interface Utm {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
  landing?: string;
}

export interface Order {
  id: string;
  razorpay_order_id: string;
  product_slug: string;
  /** Amount in paise. */
  amount: number;
  currency: "INR";
  email: string | null;
  phone: string | null;
  status: OrderStatus;
  razorpay_payment_id: string | null;
  referral_code: string | null;
  discount: number;
  utm: Utm;
  created_at: string;
  paid_at: string | null;
  fulfilled_at: string | null;
  delivery_email_sent_at: string | null;
  lock_until: string | null;
  attempts: number;
  last_error: string | null;
  capi_sent_at: string | null;
  review_ask_sent_at: string | null;
}

export interface DownloadLink {
  token_hash: string;
  order_id: string;
  expires_at: string;
  max_downloads: number;
  downloads: number;
  created_at: string;
}

export interface Lead {
  id: string;
  email: string;
  source: string;
  consent_marketing: boolean;
  segment: Record<string, string>;
  utm: Utm;
  unsubscribed_at: string | null;
  created_at: string;
}

export interface QuizResult {
  id: string;
  lead_id: string | null;
  quiz: string;
  answers: Record<string, string>;
  warmup: Record<string, string>;
  scores: Record<string, { correct: number; total: number }>;
  weakest: string | null;
  created_at: string;
}

export interface ScheduledEmail {
  id: string;
  lead_id: string;
  sequence: string;
  step: number;
  send_at: string;
  sent_at: string | null;
  cancelled_at: string | null;
}

export type ReviewStatus = "pending" | "published" | "rejected";

export interface Review {
  id: string;
  order_id: string;
  product_slug: string;
  name: string;
  role: string;
  years: string;
  rating: number;
  body: string;
  consent_publish: boolean;
  status: ReviewStatus;
  created_at: string;
}

export interface ReferralCode {
  code: string;
  order_id: string;
  email: string;
  created_at: string;
}

export interface AdSpend {
  id: string;
  date: string;
  amount: number;
  campaign: string;
  note: string | null;
}

export interface DrillSession {
  id: string;
  email: string;
  question_id: string;
  transcript: { role: "interviewer" | "candidate"; text: string }[];
  status: "active" | "done";
  score: number | null;
  rating: number | null;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  created_at: string;
}

export interface Store {
  createOrder(o: Order): Promise<Order>;
  getOrder(id: string): Promise<Order | null>;
  getOrderByRazorpayId(razorpayOrderId: string): Promise<Order | null>;
  updateOrder(id: string, patch: Partial<Order>): Promise<Order | null>;
  /** Moves created → paid. Returns the order whatever its state; never moves backwards. */
  markOrderPaid(
    id: string,
    paymentId: string,
    email: string | null,
    phone: string | null,
  ): Promise<Order | null>;
  /** Atomically takes the fulfilment lock for a paid or failed order. Null when someone else holds it or it's done. */
  claimFulfilment(id: string, lockMs: number): Promise<Order | null>;
  listOrders(fromIso: string, toIso: string): Promise<Order[]>;
  ordersDueForReviewAsk(paidBeforeIso: string): Promise<Order[]>;
  ordersByEmail(email: string): Promise<Order[]>;
  /** Paid or failed orders whose lock has expired and that were paid before the given time. */
  ordersNeedingFulfilment(paidBeforeIso: string): Promise<Order[]>;

  /** Stores a webhook event id. False when it was already seen. */
  recordWebhookEvent(eventId: string, type: string): Promise<boolean>;

  createDownloadLink(l: DownloadLink): Promise<void>;
  getDownloadLink(tokenHash: string): Promise<DownloadLink | null>;
  /** Atomically counts one download if the link is valid. Null when expired or used up. */
  consumeDownload(tokenHash: string, nowIso: string): Promise<DownloadLink | null>;
  countDownloadLinksSince(orderId: string, sinceIso: string): Promise<number>;

  upsertLead(l: Omit<Lead, "id" | "created_at" | "unsubscribed_at">): Promise<Lead>;
  getLead(id: string): Promise<Lead | null>;
  unsubscribeLead(id: string): Promise<void>;
  saveQuizResult(r: Omit<QuizResult, "id" | "created_at">): Promise<QuizResult>;
  latestQuizResult(leadId: string): Promise<QuizResult | null>;
  countQuizResults(fromIso: string, toIso: string): Promise<number>;
  countLeads(fromIso: string, toIso: string): Promise<number>;
  scheduleEmails(rows: Omit<ScheduledEmail, "id" | "sent_at" | "cancelled_at">[]): Promise<void>;
  dueEmails(nowIso: string, limit: number): Promise<ScheduledEmail[]>;
  /** Marks a scheduled email sent. False if another worker already did. */
  claimScheduledEmail(id: string): Promise<boolean>;

  createReview(r: Review): Promise<Review>;
  listReviews(status?: ReviewStatus): Promise<Review[]>;
  setReviewStatus(id: string, status: ReviewStatus): Promise<void>;
  reviewForOrder(orderId: string): Promise<Review | null>;

  createReferralCode(r: ReferralCode): Promise<ReferralCode>;
  getReferralCode(code: string): Promise<ReferralCode | null>;
  referralCodeForOrder(orderId: string): Promise<ReferralCode | null>;

  addAdSpend(a: Omit<AdSpend, "id">): Promise<AdSpend>;
  listAdSpend(fromDate: string, toDate: string): Promise<AdSpend[]>;

  createDrillSession(s: DrillSession): Promise<DrillSession>;
  getDrillSession(id: string): Promise<DrillSession | null>;
  updateDrillSession(id: string, patch: Partial<DrillSession>): Promise<void>;
  countDrillSessionsSince(email: string, sinceIso: string): Promise<number>;
  drillCostSince(sinceIso: string): Promise<number>;
}
