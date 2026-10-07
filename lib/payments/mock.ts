import "server-only";
import { randomBytes } from "node:crypto";
import { env, isProduction } from "@/lib/env";
import type { PaymentProvider } from "./provider";
import { razorpaySignature, razorpayWebhookSignature, safeEqualHex } from "./razorpay";

const MOCK_SECRET = `mock-payments:${env.authSecret}`;

export function mockSign(orderId: string, paymentId: string) {
  return razorpaySignature(orderId, paymentId, MOCK_SECRET);
}

export function mockWebhookSignature(rawBody: string) {
  return razorpayWebhookSignature(rawBody, MOCK_SECRET);
}

/** Instant, local-only provider so checkout works with zero keys. Never used in production. */
export const mockProvider: PaymentProvider = {
  name: "mock",
  async createOrder({ amount, currency }) {
    if (isProduction) throw new Error("mock payments are disabled in production");
    return { provider: "mock", orderId: `order_mock_${randomBytes(8).toString("hex")}`, amount, currency, publicKey: "mock" };
  },
  verifyPayment({ orderId, paymentId, signature }) {
    return safeEqualHex(mockSign(orderId, paymentId), signature);
  },
  parseWebhook(rawBody, headers) {
    const sig = headers.get("x-mock-signature") ?? "";
    if (!safeEqualHex(mockWebhookSignature(rawBody), sig)) return null;
    const body = JSON.parse(rawBody) as {
      event_id: string;
      event: string;
      payment?: { order_id: string; id: string; amount: number; currency: string };
      refund?: { id: string; payment_id: string };
    };
    return {
      eventId: body.event_id,
      type: body.event,
      payload: body,
      payment: body.payment ? { orderId: body.payment.order_id, paymentId: body.payment.id, amount: body.payment.amount, currency: body.payment.currency } : undefined,
      refund: body.refund ? { paymentId: body.refund.payment_id, refundId: body.refund.id } : undefined,
    };
  },
  async refund() {
    return { refundId: `rfnd_mock_${randomBytes(6).toString("hex")}` };
  },
};
