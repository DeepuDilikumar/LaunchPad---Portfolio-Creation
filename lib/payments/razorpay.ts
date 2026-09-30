import "server-only"

import { createHmac, timingSafeEqual } from "node:crypto"

/** Razorpay over its REST API (no SDK needed): create orders, verify signatures. */

function auth() {
  const id = process.env.RAZORPAY_KEY_ID
  const secret = process.env.RAZORPAY_KEY_SECRET
  if (!id || !secret) throw new Error("Razorpay is not configured")
  return { id, secret, header: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}` }
}

export async function createRazorpayOrder(amountPaise: number, receipt: string, notes: Record<string, string>) {
  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { authorization: auth().header, "content-type": "application/json" },
    body: JSON.stringify({ amount: amountPaise, currency: "INR", receipt, notes }),
  })
  if (!response.ok) throw new Error(`Razorpay order failed: ${response.status}`)
  return (await response.json()) as { id: string; amount: number; currency: string }
}

function safeEqualHex(expected: string, actual: string) {
  const a = Buffer.from(expected, "utf8")
  const b = Buffer.from(actual, "utf8")
  return a.length === b.length && timingSafeEqual(a, b)
}

/** Checkout signature: HMAC-SHA256(order_id|payment_id, key_secret). */
export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string) {
  const expected = createHmac("sha256", auth().secret).update(`${orderId}|${paymentId}`).digest("hex")
  return safeEqualHex(expected, signature)
}

/** Webhook signature: HMAC-SHA256(raw body, webhook secret). */
export function verifyWebhookSignature(rawBody: string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!secret) return false
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex")
  return safeEqualHex(expected, signature)
}

export function publicKeyId() {
  return process.env.RAZORPAY_KEY_ID ?? ""
}
