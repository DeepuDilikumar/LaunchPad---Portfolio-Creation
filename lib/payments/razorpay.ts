import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";
import type { PaymentProvider, WebhookEvent } from "./provider";
import type { Currency } from "@/config/pricing";

function hmac(secret: string, data: string) {
  return createHmac("sha256", secret).update(data).digest("hex");
}

export function safeEqualHex(a: string, b: string) {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function razorpaySignature(orderId: string, paymentId: string, secret: string) {
  return hmac(secret, `${orderId}|${paymentId}`);
}

export function razorpayWebhookSignature(rawBody: string, secret: string) {
  return hmac(secret, rawBody);
}

interface RazorpayWebhookBody {
  event: string;
  payload?: {
    payment?: { entity?: { id: string; order_id: string; amount: number; currency: string } };
    refund?: { entity?: { id: string; payment_id: string } };
  };
}

export const razorpay: PaymentProvider = {
  name: "razorpay",

  async createOrder({ amount, currency, receipt, notes }) {
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${env.razorpayKeyId}:${env.razorpayKeySecret}`).toString("base64")}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ amount, currency, receipt, notes }),
    });
    if (!res.ok) throw new Error(`razorpay order failed: ${res.status} ${await res.text().catch(() => "")}`);
    const data = (await res.json()) as { id: string; amount: number; currency: Currency };
    return { provider: "razorpay", orderId: data.id, amount: data.amount, currency: data.currency, publicKey: env.razorpayKeyId };
  },

  verifyPayment({ orderId, paymentId, signature }) {
    return safeEqualHex(razorpaySignature(orderId, paymentId, env.razorpayKeySecret), signature);
  },

  parseWebhook(rawBody, headers): WebhookEvent | null {
    const sig = headers.get("x-razorpay-signature") ?? "";
    if (!env.razorpayWebhookSecret || !safeEqualHex(razorpayWebhookSignature(rawBody, env.razorpayWebhookSecret), sig)) return null;
    let body: RazorpayWebhookBody;
    try {
      body = JSON.parse(rawBody) as RazorpayWebhookBody;
    } catch {
      return null;
    }
    const eventId = headers.get("x-razorpay-event-id") ?? hmac("event", rawBody).slice(0, 32);
    const p = body.payload?.payment?.entity;
    const r = body.payload?.refund?.entity;
    return {
      eventId,
      type: body.event,
      payload: body,
      payment: p ? { orderId: p.order_id, paymentId: p.id, amount: p.amount, currency: p.currency } : undefined,
      refund: r ? { paymentId: r.payment_id, refundId: r.id } : undefined,
    };
  },

  async refund(paymentId, amount) {
    const res = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}/refund`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${env.razorpayKeyId}:${env.razorpayKeySecret}`).toString("base64")}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(amount ? { amount } : {}),
    });
    if (!res.ok) throw new Error(`razorpay refund failed: ${res.status}`);
    const data = (await res.json()) as { id: string };
    return { refundId: data.id };
  },
};
