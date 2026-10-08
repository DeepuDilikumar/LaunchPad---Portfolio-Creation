import { expect, test } from "@playwright/test";
import { acceptEssentialCookies, completeOnboarding, mockSignIn } from "./helpers";

test("J9: admin sees the funnel, refunds a purchase, grants access and sees tutor usage", async ({ browser, page, context, baseURL }) => {
  await acceptEssentialCookies(context, baseURL!);

  // A learner buys Ledger and asks the tutor once.
  const lctx = await browser.newContext();
  await acceptEssentialCookies(lctx, baseURL!);
  const learner = await lctx.newPage();
  const email = `admin-j9-${Date.now()}@example.test`;
  await mockSignIn(learner, "email", { email });
  await completeOnboarding(learner);
  const order = (await (await learner.request.post("/api/checkout", { data: { product: "pro-project", project: "ledger", currency: "USD" } })).json()) as { orderId: string };
  const pay = (await (await learner.request.post("/api/checkout/mock-pay", { data: { orderId: order.orderId } })).json()) as { paymentId: string; signature: string };
  expect((await learner.request.post("/api/checkout/verify", { data: { provider: "mock", ...pay, orderId: order.orderId } })).ok()).toBeTruthy();
  const tutor = await learner.request.post("/api/tutor", { data: { project: "foundations", module: "setup-agents", messages: [{ role: "user", content: "claude: command not found" }] } });
  await tutor.body();
  await learner.goto("/learn/ledger/data-model");
  await expect(learner.locator("[data-paywall]")).toHaveCount(0);

  // Non-admins can't see /admin.
  const denied = await learner.goto("/admin");
  expect(denied?.status()).toBe(404);

  await mockSignIn(page, "admin");
  await page.goto("/admin");
  await expect(page.getByRole("heading", { level: 1, name: "Admin" })).toBeVisible();
  for (let i = 0; i < 5; i++) await expect(page.locator(`[data-funnel-step="${i}"]`)).toBeVisible();
  expect(Number(await page.locator('[data-funnel-step="1"]').textContent())).toBeGreaterThan(0);
  expect(Number(await page.locator('[data-funnel-step="4"]').textContent())).toBeGreaterThan(0);
  await expect(page.locator("[data-tutor-usage] tr").first()).toBeVisible();

  // Refund the purchase: access is revoked.
  const row = page.locator(`tr:has-text("${pay.paymentId}")`);
  page.once("dialog", (d) => void d.accept());
  await row.getByRole("button", { name: "Refund" }).click();
  await expect(row.locator("[data-status]")).toHaveText("refunded");
  await learner.goto("/learn/ledger/data-model");
  await expect(learner.locator("[data-paywall]")).toBeVisible();

  // Manual grant restores access.
  await page.getByLabel("Learner handle or email").fill(email);
  await page.getByLabel("Scope").first().selectOption("project:ledger");
  await page.getByRole("button", { name: "Grant access" }).click();
  await expect(page.getByText(/Granted project:ledger/)).toBeVisible();
  await learner.goto("/learn/ledger/data-model");
  await expect(learner.locator("[data-paywall]")).toHaveCount(0);

  // Bulk coupon codes from the UI.
  await page.getByLabel("How many codes").fill("3");
  await page.getByRole("button", { name: "Create codes" }).click();
  await expect(page.locator("[data-new-codes]")).toContainText("TEAM-");

  await lctx.close();
});
