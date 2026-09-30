import path from "node:path"

import { expect, test, type Page } from "@playwright/test"

/**
 * The whole student journey in demo mode, at phone width:
 * upload → auto-filled profile → template → sign in → publish → report → pay (test) →
 * resume rewrite → program → Day 1 → defend → announce → settings → delete.
 */
test.use({ viewport: { width: 375, height: 800 } })
test.describe.configure({ mode: "serial", timeout: 120_000 })

const shots = process.env.E2E_SCREENSHOTS
async function snap(page: Page, name: string) {
  if (shots) await page.screenshot({ path: path.join(shots, `${name}.png`), fullPage: true })
}

test("a student goes from resume to a live portfolio, report and program", async ({ page }) => {
  // 1. Upload
  await page.goto("/start")
  await expect(page.getByRole("heading", { name: "Upload your resume" })).toBeVisible()
  await snap(page, "01-upload")
  await page.locator("#resume-file").setInputFiles(path.join(__dirname, "fixtures/resume.txt"))
  await page.waitForURL("**/start/profile", { timeout: 20_000 }).catch(async () => {
    await page.getByRole("link", { name: "Continue" }).click()
    await page.waitForURL("**/start/profile")
  })

  // 2. Profile is auto-filled
  await expect(page.getByLabel("Name", { exact: false }).first()).toHaveValue("Asha Rao")
  await snap(page, "02-profile")
  await page.getByRole("button", { name: "Continue" }).click()

  // 3. Template
  await page.waitForURL("**/start/template")
  await snap(page, "03-template")
  await page.getByRole("button", { name: /^Continue with/ }).click()

  // 4. Publish → sign in (demo) → auto-publish
  await page.waitForURL("**/start/publish")
  await snap(page, "04-publish")
  await page.getByRole("link", { name: "Sign in to publish" }).click()
  await page.getByRole("button", { name: "Continue with a demo account" }).click()
  await expect(page.getByRole("heading", { name: "Your portfolio is live" })).toBeVisible({ timeout: 20_000 })
  await snap(page, "05-live")

  // Public page works
  const slugLink = page.locator('a[href^="/p/"]').first()
  const href = await slugLink.getAttribute("href")
  await page.goto(href!)
  await expect(page.getByRole("heading", { name: "Asha Rao" })).toBeVisible()
  await snap(page, "06-public-portfolio")

  // 5. Home shows the next step
  await page.goto("/home")
  await expect(page.getByRole("heading", { name: "Here's your next step" })).toBeVisible()
  await snap(page, "07-home")

  // 6. Report: free teaser, then test payment unlocks everything
  await page.goto("/report")
  await page.getByRole("button", { name: /Check my profile/ }).click()
  await expect(page.getByRole("button", { name: /Unlock full report/ })).toBeVisible({ timeout: 30_000 })
  await snap(page, "08-report-teaser")
  await page.getByRole("button", { name: /Unlock full report/ }).click()
  await page.getByRole("button", { name: /Complete test payment/ }).click()
  await expect(page.getByText("Unlocked. Here's your full report.")).toBeVisible({ timeout: 20_000 })
  await snap(page, "09-report-full")

  // 7. Resume rewrite
  await page.goto("/report/resume")
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
  await snap(page, "10-resume")

  // 8. Program: buy (test), pick a project, do Day 1
  await page.goto("/program")
  await snap(page, "11-program-intro")
  await page.getByRole("button", { name: /Join the program/ }).click()
  await page.getByRole("button", { name: /Complete test payment/ }).click()
  await expect(page.getByRole("heading", { name: "Pick your project" })).toBeVisible({ timeout: 20_000 })
  await snap(page, "12-picker")
  await page.getByRole("button", { name: "Start without GitHub (demo)" }).click()
  await expect(page.getByRole("link", { name: "Start today's task" })).toBeVisible({ timeout: 20_000 })
  await snap(page, "13-program")
  await page.getByRole("link", { name: "Start today's task" }).click()
  await page.waitForURL("**/program/day/1")
  await snap(page, "14-day1")
  await page.getByRole("button", { name: "Mark today done" }).last().click()
  await expect(page.getByText("Day 1 done").first()).toBeVisible({ timeout: 20_000 })
  await snap(page, "15-day1-done")

  // 9. Defend: a question from Day 1, rule-based feedback
  await page.goto("/program/defend")
  const firstQuestion = page.locator("li button[aria-expanded]").first()
  if ((await firstQuestion.getAttribute("aria-expanded")) !== "true") await firstQuestion.click()
  await page
    .getByLabel("Your answer")
    .first()
    .fill("I set up the project structure with a clear separation between the API layer, the service layer and the database layer, and added health checks and config through environment variables so it runs the same everywhere.")
  await page.getByRole("button", { name: "Get feedback" }).click()
  await expect(page.getByText(/key points covered/)).toBeVisible({ timeout: 20_000 })
  await snap(page, "16-defend")

  // 10. Announce: a draft is written automatically
  await page.goto("/program/announce")
  await expect(page.locator("#pitch-text")).not.toHaveValue("", { timeout: 20_000 })
  await snap(page, "17-announce")

  // 11. Settings → delete everything
  await page.goto("/settings")
  await snap(page, "18-settings")
  await page.getByRole("button", { name: "Delete account and data" }).click()
  await page.getByRole("button", { name: "Delete everything" }).click()
  await page.waitForURL((url) => url.pathname === "/")
  await page.goto(href!)
  await expect(page.getByRole("heading", { name: "This portfolio isn't available" })).toBeVisible()
})
