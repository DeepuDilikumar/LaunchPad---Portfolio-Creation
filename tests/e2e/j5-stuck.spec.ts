import { expect, test } from "@playwright/test";
import { acceptEssentialCookies, completeOnboarding, mockSignIn } from "./helpers";

test("J5: a stuck learner asks the tutor in context, and hits the daily limit politely", async ({ page, context, baseURL }) => {
  await acceptEssentialCookies(context, baseURL!);
  await mockSignIn(page, "email", { email: `stuck-${Date.now()}@example.test` });
  await completeOnboarding(page);

  await page.goto("/learn/foundations/tests-as-guardrails");
  const pitfall = page.locator('[data-cell="pitfall-edits-tests"]');
  await pitfall.getByRole("button", { name: /edits the tests to make them pass/ }).click();
  await expect(pitfall.getByText("Recovery prompt")).toBeVisible();
  await pitfall.getByRole("button", { name: "Still stuck? Ask the tutor about this step" }).click();

  // Drawer opens with the current cell attached.
  const drawer = page.getByRole("dialog", { name: "Notebook drawer" });
  await expect(drawer).toBeVisible();
  await expect(drawer.locator('[data-tutor-attached="pitfall-edits-tests"]')).toBeVisible();

  const error = "AssertionError: expected false to be true // Object.is equality\n ❯ test/rate-limit.test.ts:23:26";
  await drawer.getByLabel("Message the tutor").fill(error);
  const reqPromise = page.waitForRequest((r) => r.url().endsWith("/api/tutor"));
  await drawer.getByRole("button", { name: "Send" }).click();
  const req = await reqPromise;
  const sent = req.postDataJSON() as { project: string; module: string; cellId: string; messages: { content: string }[] };
  expect(sent).toMatchObject({ project: "foundations", module: "tests-as-guardrails", cellId: "pitfall-edits-tests" });
  expect(sent.messages.at(-1)!.content).toContain("AssertionError");

  const reply = drawer.locator("[data-tutor-reply]").last();
  await expect(reply).toContainText("Tests as guardrails");
  await expect(reply).toContainText("AssertionError: expected false to be true");
  await expect(reply.getByText("Recovery prompt")).toBeVisible();

  // Use up the rest of today's free messages (10 per day).
  for (let i = 0; i < 9; i++) {
    const res = await page.request.post("/api/tutor", { data: { project: "foundations", module: "tests-as-guardrails", messages: [{ role: "user", content: `question ${i}` }] } });
    expect(res.status()).toBe(200);
    await res.body();
  }
  await drawer.getByLabel("Message the tutor").fill("one more question");
  await drawer.getByRole("button", { name: "Send" }).click();
  const limit = drawer.locator("[data-tutor-limit]");
  await expect(limit).toContainText("You've used today's 10 tutor messages");
  await expect(limit).toContainText("UTC");
});
