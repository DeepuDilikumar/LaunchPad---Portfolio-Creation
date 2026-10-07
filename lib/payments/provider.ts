import type { Currency } from "@/config/pricing";

export interface CreatedOrder {
  provider: string;
  orderId: string;
  amount: number;
  currency: Currency;
  /** Public key for the client checkout widget (not secret). */
  publicKey: string;
}

export interface WebhookEvent {
  eventId: string;
  type: string;
  payload: unknown;
  /** Normalised fields for the events we act on. */
  payment?: { orderId: string; paymentId: string; amount: number; currency: string };
  refund?: { paymentId: string; refundId: string };
}

/**
 * Payment provider boundary. Razorpay today; Stripe can implement the same interface.
 * The server always decides the amount (from config/pricing.ts); the client never sends one.
 */
export interface PaymentProvider {
  name: string;
  createOrder(input: { amount: number; currency: Currency; receipt: string; notes: Record<string, string> }): Promise<CreatedOrder>;
  /** Verify the client-side success callback. */
  verifyPayment(input: { orderId: string; paymentId: string; signature: string }): boolean;
  /** Verify and parse a webhook. Returns null when the signature is invalid. */
  parseWebhook(rawBody: string, headers: Headers): WebhookEvent | null;
  refund(paymentId: string, amount?: number): Promise<{ refundId: string }>;
}
