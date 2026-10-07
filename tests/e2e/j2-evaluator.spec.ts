import { expect, test } from "@playwright/test";
import { acceptEssentialCookies } from "./helpers";

test("J2: an evaluator reads a free module logged out and sees the paywall on a paid one", async ({ page, context, baseURL }) => {
  await acceptEssentialCookies(context, baseURL!);
  await page.goto("/");
  await page.getByRole("link", { name: "See the projects" }).first().click();
  await expect(page).toHaveURL(/\/projects$/);
  await page.getByRole("link", { name: /Pulse/ }).first().click();
  await expect(page).toHaveURL(/\/projects\/pulse$/);
  await expect(page.getByRole("heading", { name: "Syllabus" })).toBeVisible();

  // Course JSON-LD is present on syllabus pages
  const ld = await page.locator('script[type="application/ld+json"]').first().textContent();
  expect(JSON.parse(ld!)["@type"]).toBe("Course");

  // Free module renders fully for a logged-out visitor
  await page.getByRole("link", { name: /Data model/ }).first().click();
  await expect(page).toHaveURL(/\/learn\/pulse\/data-model/);
  await expect(page.locator("[data-paywall]")).toHaveCount(0);
  await expect(page.locator('[data-decision="decision-receipts"]')).toBeVisible();
  await expect(page.locator('[data-checkpoint="constraints-tested"]')).toBeVisible();
  expect(await page.locator("[data-cell]").count()).toBeGreaterThan(15);

  // Interacting asks to sign in, and returns to the same cell
  await page.locator('[data-checkpoint="constraints-tested"] [data-action="mark-passed"]').click();
  await expect(page.getByRole("dialog", { name: "Save your progress" })).toBeVisible();
  await expect(page.locator('[data-cta="notebook-signin"]')).toHaveAttribute("href", /next=%2Flearn%2Fpulse%2Fdata-model%23cell-constraints-tested/);

  // Paid module: teaser + upgrade card, no paid content
  await page.goto("/learn/pulse/delivery-receipts");
  await expect(page.locator("[data-paywall]")).toBeVisible();
  expect(await page.locator("[data-cell]").count()).toBe(1);

  // FAQ answers are readable without signing up
  await page.goto("/");
  await page.getByRole("button", { name: "Will this get me a job?" }).click();
  await expect(page.getByText("No course can promise that.")).toBeVisible();
});
