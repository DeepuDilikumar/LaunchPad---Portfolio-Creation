import { createHmac } from "node:crypto";
import { expect, test } from "@playwright/test";
import { acceptEssentialCookies, completeOnboarding, mockSignIn } from "./helpers";

const MOCK_SECRET = `mock-payments:${process.env.AUTH_SECRET ?? "dev-only-secret-change-me-in-production-0123456789"}`;

test("J3: a free learner hits the paywall, buys in INR, and lands back in the module unlocked", async ({ page, context, baseURL }) => {
  await acceptEssentialCookies(context, baseURL!);
  // Visitor from India: the hosting geo header becomes this cookie.
  await context.addCookies([{ name: "bp_cc", value: "IN", url: baseURL! }]);
  await mockSignIn(page, "email", { email: `buyer-${Date.now()}@example.test` });
  await completeOnboarding(page);

  await page.goto("/learn/pulse/delivery-receipts");
  const paywall = page.locator("[data-paywall]");
  await expect(paywall).toBeVisible();
  const buy = paywall.getByRole("link", { name: /Get Pulse · ₹1,499/ });
  await expect(buy).toBeVisible();
  await buy.click();

  await expect(page).toHaveURL(/\/checkout\?/);
  await expect(page.locator("[data-total]")).toHaveText("₹1,499");

  const orderRes = page.waitForResponse((r) => r.url().endsWith("/api/checkout") && r.request().method() === "POST");
  await page.locator('[data-action="pay"]').click();
  const order = (await (await orderRes).json()) as { orderId: string; amount: number; currency: string };
  expect(order.amount).toBe(149900);
  expect(order.currency).toBe("INR");

  // Double-submit the mock payment.
  const payBtn = page.locator('[data-action="mock-pay"]');
  await payBtn.dblclick();

  // Back in the module, unlocked (it's still being written, so it says so instead of a paywall).
  await expect(page).toHaveURL(/\/learn\/pulse\/delivery-receipts/, { timeout: 15_000 });
  await expect(page.locator("[data-paywall]")).toHaveCount(0);
  await expect(page.locator("[data-releasing-soon]")).toBeVisible();

  // Duplicate webhooks for the same payment don't create duplicates.
  const paymentRes = await page.request.post("/api/checkout/mock-pay", { data: { orderId: order.orderId } });
  const { paymentId } = (await paymentRes.json()) as { paymentId: string };
  const send = async (eventId: string) => {
    const body = JSON.stringify({ event_id: eventId, event: "payment.captured", payment: { order_id: order.orderId, id: paymentId, amount: order.amount, currency: "INR" } });
    const sig = createHmac("sha256", MOCK_SECRET).update(body).digest("hex");
    const res = await page.request.post("/api/webhooks/mock", { data: body, headers: { "content-type": "application/json", "x-mock-signature": sig } });
    expect(res.ok()).toBeTruthy();
    return (await res.json()) as { duplicate: boolean; processed: boolean };
  };
  expect(await send("evt_j3_1")).toMatchObject({ duplicate: false, processed: true });
  expect(await send("evt_j3_1")).toMatchObject({ duplicate: true });

  // A forged webhook is rejected.
  const forged = await page.request.post("/api/webhooks/mock", { data: '{"event_id":"x","event":"payment.captured"}', headers: { "x-mock-signature": "nope" } });
  expect(forged.status()).toBe(400);

  // Verifying the same payment again is a no-op that still succeeds.
  const sig = createHmac("sha256", MOCK_SECRET).update(`${order.orderId}|${paymentId}`).digest("hex");
  const again = await page.request.post("/api/checkout/verify", { data: { provider: "mock", orderId: order.orderId, paymentId, signature: sig } });
  expect(again.ok()).toBeTruthy();

  // The rail shows Pulse paid modules as unlocked.
  await page.goto("/learn/pulse/presence-at-scale");
  await expect(page.locator("[data-paywall]")).toHaveCount(0);
});
