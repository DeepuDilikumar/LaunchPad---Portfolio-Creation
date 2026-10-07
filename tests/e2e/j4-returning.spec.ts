import { expect, test } from "@playwright/test";
import { acceptEssentialCookies, completeOnboarding, mockSignIn } from "./helpers";

test("J4: a returning learner continues where they left off", async ({ page, context, baseURL }) => {
  await acceptEssentialCookies(context, baseURL!);
  await mockSignIn(page, "email", { email: `returning-${Date.now()}@example.test` });
  await completeOnboarding(page);

  // Earlier session: worked in Foundations module 3, last touched the "take the wheel" cell.
  for (const cellId of ["intro", "failing-tests", "take-the-wheel"]) {
    const res = await page.request.post("/api/progress", {
      data: { project: "foundations", module: "tests-as-guardrails", cellId, kind: "touch" },
    });
    expect(res.ok()).toBeTruthy();
    await page.waitForTimeout(20);
  }

  await page.goto("/dashboard");
  await expect(page.locator("[data-continue-label]")).toHaveText("Foundations · Module 3 · Tests as guardrails");
  await page.locator("[data-continue]").getByRole("link", { name: "Continue" }).click();
  await expect(page).toHaveURL(/\/learn\/foundations\/tests-as-guardrails/);

  // Resumes at the last touched cell
  const cell = page.locator("#cell-take-the-wheel");
  await expect(cell).toBeFocused();
  await expect(cell).toBeInViewport();
});
