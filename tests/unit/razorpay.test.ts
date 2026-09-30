import { createHmac } from "node:crypto"

import { beforeAll, describe, expect, it } from "vitest"

import { verifyPaymentSignature, verifyWebhookSignature } from "@/lib/payments/razorpay"

beforeAll(() => {
  process.env.RAZORPAY_KEY_ID = "rzp_test_key"
  process.env.RAZORPAY_KEY_SECRET = "secret123"
  process.env.RAZORPAY_WEBHOOK_SECRET = "whsecret"
})

describe("Razorpay signatures", () => {
  it("accepts a valid checkout signature and rejects tampering", () => {
    const sig = createHmac("sha256", "secret123").update("order_1|pay_1").digest("hex")
    expect(verifyPaymentSignature("order_1", "pay_1", sig)).toBe(true)
    expect(verifyPaymentSignature("order_1", "pay_2", sig)).toBe(false)
    expect(verifyPaymentSignature("order_1", "pay_1", "short")).toBe(false)
  })

  it("verifies webhook signatures on the raw body", () => {
    const body = JSON.stringify({ event: "payment.captured" })
    const sig = createHmac("sha256", "whsecret").update(body).digest("hex")
    expect(verifyWebhookSignature(body, sig)).toBe(true)
    expect(verifyWebhookSignature(body + " ", sig)).toBe(false)
  })
})
