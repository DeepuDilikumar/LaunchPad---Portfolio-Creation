import { beforeEach, describe, expect, it } from "vitest";
import { site } from "@/config/site";
import { checkLimits, costUsd, hasDrillAccess, USD_TO_INR } from "@/lib/drill";
import { setupWorld } from "./helpers";

describe("drill cost and limits", () => {
  let w: Awaited<ReturnType<typeof setupWorld>>;
  beforeEach(async () => {
    w = await setupWorld();
  });

  it("logs cost from token counts", () => {
    expect(costUsd("claude-opus-5-5", 1_000_000, 0)).toBe(4);
    expect(costUsd("claude-haiku-5-5", 0, 1_000_000)).toBe(0.5);
    expect(costUsd("unknown-model", 1_000_000, 0)).toBe(10);
  });

  it("enforces the daily cap and the monthly budget", async () => {
    const base = {
      email: "d@x.in",
      question_id: "be-pay-001",
      transcript: [],
      status: "done" as const,
      score: 5,
      rating: null,
      input_tokens: 0,
      output_tokens: 0,
    };
    for (let i = 0; i < site.drill.dailySessionCap; i++) {
      await w.store.createDrillSession({
        ...base,
        id: `d${i}`,
        cost_usd: 0,
        created_at: new Date().toISOString(),
      });
    }
    expect(await checkLimits("d@x.in")).toMatch(/daily cap/);
    await w.store.createDrillSession({
      ...base,
      id: "big",
      email: "other@x.in",
      cost_usd: site.drill.monthlyBudgetInr / USD_TO_INR + 1,
      created_at: new Date().toISOString(),
    });
    expect(await checkLimits("new@x.in")).toMatch(/resting/);
  });

  it("gives access only to recent buyers", async () => {
    expect(await hasDrillAccess("nobody@x.in")).toBe(false);
    const now = new Date().toISOString();
    await w.store.createOrder({
      id: "sq_d",
      razorpay_order_id: "o",
      product_slug: "backend",
      amount: 49900,
      currency: "INR",
      email: "buyer@x.in",
      phone: null,
      status: "fulfilled",
      razorpay_payment_id: "p",
      referral_code: null,
      discount: 0,
      utm: {},
      created_at: now,
      paid_at: now,
      fulfilled_at: now,
      delivery_email_sent_at: now,
      lock_until: null,
      attempts: 1,
      last_error: null,
      capi_sent_at: null,
      review_ask_sent_at: null,
    });
    expect(await hasDrillAccess("buyer@x.in")).toBe(true);
  });
});
