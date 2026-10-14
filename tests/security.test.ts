import { describe, expect, it } from "vitest";
import { hmacHex, signToken, verifyToken } from "@/lib/ids";
import { verifyPaymentSignature, verifyWebhookSignature } from "@/lib/razorpay";
import { utmFromUrl, parseUtmCookie } from "@/lib/utm";

describe("razorpay signatures", () => {
  it("accepts a valid webhook signature and rejects a tampered body", () => {
    const body = JSON.stringify({ event: "payment.captured" });
    const sig = hmacHex("whsec", body);
    expect(verifyWebhookSignature(body, sig, "whsec")).toBe(true);
    expect(verifyWebhookSignature(body + " ", sig, "whsec")).toBe(false);
    expect(verifyWebhookSignature(body, null, "whsec")).toBe(false);
  });

  it("checks the checkout handler signature", () => {
    const sig = hmacHex("secret", "order_1|pay_1");
    expect(verifyPaymentSignature("order_1", "pay_1", sig, "secret")).toBe(true);
    expect(verifyPaymentSignature("order_1", "pay_2", sig, "secret")).toBe(false);
  });
});

describe("signed tokens", () => {
  it("round-trip and reject tampering or expiry", () => {
    const t = signToken({ l: "lead_1" });
    expect(verifyToken<{ l: string }>(t)?.l).toBe("lead_1");
    expect(verifyToken(t.replace(/.$/, (c) => (c === "a" ? "b" : "a")))).toBeNull();
    expect(verifyToken(signToken({ o: "x", exp: Date.now() - 1 }))).toBeNull();
  });
});

describe("utm capture", () => {
  it("reads utm params and ignores junk cookies", () => {
    expect(utmFromUrl(new URL("https://x.in/check?utm_source=ig&utm_campaign=reel1"))).toEqual({
      source: "ig",
      campaign: "reel1",
      landing: "/check",
    });
    expect(utmFromUrl(new URL("https://x.in/"))).toBeNull();
    expect(parseUtmCookie("not json")).toEqual({});
  });
});
