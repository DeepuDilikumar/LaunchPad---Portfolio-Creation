import { expect, test } from "@playwright/test"

test.describe("landing at 375px", () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test("primary CTA is visible without scrolling", async ({ page }) => {
    await page.goto("/")
    const cta = page.locator("#main").getByRole("link", { name: "Upload resume — free" }).first()
    await expect(cta).toBeInViewport({ ratio: 1 })
    await expect(cta).toHaveAttribute("href", "/start")
  })

  test("has no horizontal scroll", async ({ page }) => {
    await page.goto("/")
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    )
    expect(overflow).toBeLessThanOrEqual(0)
  })

  test("sticky CTA appears after the hero and hides at the final CTA", async ({ page }) => {
    await page.goto("/")
    const sticky = page.locator("[inert], [aria-hidden]").filter({ hasText: "Free · ~2 min · No sign-up" })
    await expect(sticky).toHaveAttribute("aria-hidden", "true")
    await page.locator("#pricing").scrollIntoViewIfNeeded()
    await expect(sticky).toHaveAttribute("aria-hidden", "false")
    await page.locator("#final-cta-title").scrollIntoViewIfNeeded()
    await expect(sticky).toHaveAttribute("aria-hidden", "true")
  })

  test("mobile menu sets and persists the theme", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("button", { name: "Open menu" }).click()
    // Tap the visible segment, like a user would (the native radio is visually hidden).
    await page.getByRole("dialog").getByText("Dark", { exact: true }).click()
    await expect(page.getByRole("radio", { name: "Dark" })).toBeChecked()
    await expect(page.locator("html")).toHaveClass(/dark/)
    expect(await page.evaluate(() => localStorage.getItem("launchpad_theme"))).toBe("dark")
    // Anti-flash: the class is present in the very first paint after reload.
    await page.reload()
    await expect(page.locator("html")).toHaveClass(/dark/)
  })

  test("FAQ opens with the keyboard", async ({ page }) => {
    await page.goto("/")
    const summary = page.getByText("Is my resume private?")
    await summary.focus()
    await page.keyboard.press("Enter")
    await expect(page.getByText(/stored in a private storage bucket|private bucket/)).toBeVisible()
  })
})

test("reduced motion shows the hero preview immediately", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto("/", { waitUntil: "domcontentloaded" })
  const rows = page.locator("figure[role=img] .animate-rise")
  expect(await rows.count()).toBeGreaterThan(0)
  for (const opacity of await rows.evaluateAll((els) => els.map((e) => getComputedStyle(e).opacity))) {
    expect(opacity).toBe("1")
  }
})

test("desktop theme toggle flips light and dark", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.emulateMedia({ colorScheme: "light" })
  await page.goto("/")
  await page.getByRole("button", { name: "Switch to dark theme" }).click()
  await expect(page.locator("html")).toHaveClass(/dark/)
  await page.getByRole("button", { name: "Switch to light theme" }).click()
  await expect(page.locator("html")).not.toHaveClass(/dark/)
})

test("login page works without Supabase configured", async ({ page }) => {
  await page.goto("/login")
  await expect(page.getByRole("heading", { name: "Sign in to LaunchPad" })).toBeVisible()
  await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible()
})

test("unknown routes show the friendly 404", async ({ page }) => {
  const response = await page.goto("/does-not-exist")
  expect(response?.status()).toBe(404)
  await expect(page.getByRole("heading", { name: "We couldn't find that page" })).toBeVisible()
})
