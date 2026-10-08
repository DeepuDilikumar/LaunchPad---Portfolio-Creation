import { expect, test, devices } from "@playwright/test";

test.use({ ...devices["Pixel 7"], launchOptions: { executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" } });

test("J7: a recruiter opens a public profile on mobile: fast, no sign-in prompts", async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: "bp_consent", value: "essential", url: baseURL! }]);
  const cdp = await context.newCDPSession(page);
  // Throttled: fast 4G-ish network and a mid-range CPU.
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 150, downloadThroughput: (9 * 1024 * 1024) / 8, uploadThroughput: (1.5 * 1024 * 1024) / 8 });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });

  await page.addInitScript(() => {
    (window as unknown as { __lcp: number }).__lcp = 0;
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) (window as unknown as { __lcp: number }).__lcp = e.startTime;
    }).observe({ type: "largest-contentful-paint", buffered: true });
  });

  await page.goto("/u/sample", { waitUntil: "load" });
  await expect(page.getByRole("heading", { level: 1, name: "Sample learner" })).toBeVisible();
  await expect(page.locator("[data-project-card]")).toHaveCount(1);
  await expect(page.getByRole("link", { name: /Live demo/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Repo/ }).first()).toBeVisible();
  // The sample is never shown as verified.
  await expect(page.locator("[data-verified-badge]")).toHaveCount(0);
  await expect(page.locator("[data-sample-banner]")).toBeVisible();

  // No auth prompts anywhere.
  await expect(page).toHaveURL(/\/u\/sample$/);
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await page.waitForTimeout(500);
  const lcp = await page.evaluate(() => (window as unknown as { __lcp: number }).__lcp);
  console.log(`LCP (throttled): ${Math.round(lcp)}ms`);
  if (process.env.E2E_PERF !== "0") expect(lcp).toBeLessThan(2000);

  // The project page opens and shows the case study.
  await page.getByRole("link", { name: "Case study" }).click();
  await expect(page.getByRole("heading", { name: "Case study" })).toBeVisible();
});
