import { expect, test } from "@playwright/test";
import { acceptEssentialCookies, clicks, countClicks } from "./helpers";

test("J1: a cold visitor reaches a passed checkpoint in 6 clicks or fewer", async ({ page, context, baseURL }) => {
  await acceptEssentialCookies(context, baseURL!);
  await countClicks(page);

  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: /Build what big tech runs/ })).toBeVisible();

  // 1. Start free
  await page.locator('[data-cta="hero-start"]').click();
  await expect(page).toHaveURL(/\/login\?next=/);

  // 2. Continue with GitHub (simulated in mock mode: creates a new account)
  await page.locator('[data-auth="github"]').click();
  await expect(page).toHaveURL(/\/onboarding/);

  // 3–5. Three taps of onboarding
  await page.locator('[data-choice="0-2"]').click();
  await page.locator('[data-choice="backend"]').click();
  await page.locator('[data-choice="claude"]').click();

  // Lands on Foundations module 1
  await expect(page).toHaveURL(/\/learn\/foundations\/setup-agents/);
  await expect(page.getByRole("heading", { level: 1, name: "Set up your agents" })).toBeVisible();

  // 6. Mark the first checkpoint as passed
  const checkpoint = page.locator('[data-checkpoint="cli-installed"]');
  await checkpoint.locator('[data-action="mark-passed"]').click();
  await expect(checkpoint).toHaveAttribute("data-status", "passed");
  await expect(page.locator('[data-celebration="first"]')).toBeVisible();
  await expect(page.getByRole("link", { name: "Next: plan before you build" })).toBeVisible();

  expect(await clicks(page)).toBeLessThanOrEqual(6);

  // Progress survived a reload (it was saved server-side).
  await page.reload();
  await expect(page.locator('[data-checkpoint="cli-installed"]')).toHaveAttribute("data-status", "passed");
});
