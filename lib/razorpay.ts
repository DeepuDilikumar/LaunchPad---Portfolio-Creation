import { hmacHex, safeEqualHex } from "./ids";

/**
 * Razorpay Orders API and signature checks, without the SDK.
 * Docs: https://razorpay.com/docs/api/orders/ and https://razorpay.com/docs/webhooks/validate-test/
 */

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

export interface RazorpayPayment {
  id: string;
  order_id: string;
  amount: number;
  status: string;
  email?: string;
  contact?: string;
}

export interface RazorpayWebhook {
  event: string;
  payload: {
    payment?: { entity: RazorpayPayment };
    order?: { entity: RazorpayOrder };
  };
  created_at: number;
}

function creds(): { keyId: string; keySecret: string } {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set");
  return { keyId, keySecret };
}

export function razorpayConfigured(): boolean {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

async function api<T>(method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
  const { keyId, keySecret } = creds();
  const res = await fetch(`https://api.razorpay.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`razorpay ${method} ${path}: ${res.status} ${await res.text()}`);
  return (await res.json()) as T;
}

export function createRazorpayOrder(input: {
  amountPaise: number;
  receipt: string;
  notes: Record<string, string>;
}): Promise<RazorpayOrder> {
  return api("POST", "/orders", {
    amount: input.amountPaise,
    currency: "INR",
    receipt: input.receipt,
    notes: input.notes,
  });
}

export function fetchPayment(paymentId: string): Promise<RazorpayPayment> {
  return api("GET", `/payments/${paymentId}`);
}

/** Webhook: HMAC-SHA256 of the raw body with the webhook secret. */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string | null,
  secret: string,
): boolean {
  if (!signature) return false;
  return safeEqualHex(hmacHex(secret, rawBody), signature);
}

/** Checkout handler: HMAC-SHA256 of `order_id|payment_id` with the key secret. */
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string,
): boolean {
  return safeEqualHex(hmacHex(secret, `${orderId}|${paymentId}`), signature);
}
