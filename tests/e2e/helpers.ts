import { expect, type Page, type BrowserContext } from "@playwright/test";

export async function acceptEssentialCookies(context: BrowserContext, baseURL: string) {
  await context.addCookies([{ name: "bp_consent", value: "essential", url: baseURL }]);
}

/** Sign in through the mock auth endpoint (the same one the login page uses). */
export async function mockSignIn(page: Page, method: "demo" | "admin" | "github" | "email", opts: { email?: string; next?: string } = {}) {
  const res = await page.request.post("/api/auth/mock", { data: { method, email: opts.email, next: opts.next ?? "/dashboard" } });
  expect(res.ok()).toBeTruthy();
  return (await res.json()) as { redirect: string };
}

export async function completeOnboarding(page: Page) {
  const res = await page.request.post("/api/onboarding", { data: { experienceLevel: "0-2", targetRole: "backend", preferredTool: "claude" } });
  expect(res.ok()).toBeTruthy();
}

/** Counts real user clicks on the page. */
export async function countClicks(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __clicks?: number };
    const stored = Number(sessionStorage.getItem("__clicks") ?? "0");
    w.__clicks = stored;
    document.addEventListener(
      "click",
      (e) => {
        if (!e.isTrusted) return;
        w.__clicks = (w.__clicks ?? 0) + 1;
        sessionStorage.setItem("__clicks", String(w.__clicks));
      },
      true,
    );
  });
}

export async function clicks(page: Page) {
  return page.evaluate(() => Number(sessionStorage.getItem("__clicks") ?? "0"));
}
