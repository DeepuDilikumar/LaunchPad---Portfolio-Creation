/**
 * Replays the user journeys (J1–J9) and saves screenshots for the README into docs/screenshots.
 *
 *   pnpm build
 *   PGLITE_DIR=.data/shots MOCK_MODE=true ALLOW_MOCK=1 TUTOR_BURST_PER_MINUTE=100 pnpm start -p 3200
 *   BASE_URL=http://localhost:3200 pnpm screenshots:journeys
 *
 * Use a fresh PGLITE_DIR so every journey starts from the seeded state.
 */
import { mkdirSync } from "node:fs";
import { chromium, devices, type Browser, type BrowserContext, type Locator, type Page } from "@playwright/test";

const base = process.env.BASE_URL ?? "http://localhost:3200";
const out = "docs/screenshots";
const executablePath = process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const stamp = Date.now();

async function context(browser: Browser, opts: { mobile?: boolean; country?: string } = {}) {
  const ctx = await browser.newContext(
    opts.mobile ? { ...devices["Pixel 7"] } : { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  );
  await ctx.addCookies([{ name: "bp_consent", value: "essential", url: base }]);
  if (opts.country) await ctx.addCookies([{ name: "bp_cc", value: opts.country, url: base }]);
  return ctx;
}

async function shot(page: Page, name: string, focus?: Locator, offset = 96) {
  if (focus) {
    await focus.first().evaluate((el, o) => {
      el.scrollIntoView({ block: "start" });
      window.scrollBy(0, -o);
    }, offset);
  }
  await page.waitForTimeout(700);
  const path = `${out}/${name}.jpg`;
  await page.screenshot({ path, type: "jpeg", quality: 78 });
  console.log("saved", path);
}

async function signIn(page: Page, method: string, email?: string) {
  const res = await page.request.post(`${base}/api/auth/mock`, { data: { method, email, next: "/dashboard" } });
  if (!res.ok()) throw new Error(`sign-in failed: ${res.status()}`);
}

async function onboard(page: Page) {
  await page.request.post(`${base}/api/onboarding`, { data: { experienceLevel: "0-2", targetRole: "backend", preferredTool: "claude" } });
}

async function learner(browser: Browser, name: string, opts: { country?: string } = {}): Promise<{ ctx: BrowserContext; page: Page; email: string }> {
  const ctx = await context(browser, opts);
  const page = await ctx.newPage();
  const email = `${name}-${stamp}@example.test`;
  await signIn(page, "email", email);
  await onboard(page);
  return { ctx, page, email };
}

async function j1(browser: Browser) {
  const ctx = await context(browser);
  const page = await ctx.newPage();
  await page.goto(`${base}/`);
  await page.waitForTimeout(4500); // let the hero demo play a few steps
  await shot(page, "j1-1-landing");
  await page.locator('[data-cta="hero-start"]').click();
  await page.waitForURL(/\/login/);
  await shot(page, "j1-2-sign-in");
  await page.locator('[data-auth="github"]').click();
  await page.waitForURL(/\/onboarding/);
  await shot(page, "j1-3-onboarding");
  await page.locator('[data-choice="0-2"]').click();
  await page.locator('[data-choice="backend"]').click();
  await page.locator('[data-choice="claude"]').click();
  await page.waitForURL(/\/learn\/foundations\/setup-agents/);
  const cp = page.locator('[data-checkpoint="cli-installed"]');
  await cp.locator('[data-action="mark-passed"]').click();
  await page.locator('[data-celebration="first"]').waitFor();
  await shot(page, "j1-4-first-checkpoint", cp, 160);
  await ctx.close();
}

async function j2(browser: Browser) {
  const ctx = await context(browser);
  const page = await ctx.newPage();
  await page.goto(`${base}/projects`);
  await shot(page, "j2-1-projects");
  await page.goto(`${base}/projects/pulse`);
  await shot(page, "j2-2-syllabus", page.getByRole("heading", { name: "Syllabus" }), 40);
  await page.goto(`${base}/learn/pulse/data-model`);
  await page.waitForTimeout(1200);
  await shot(page, "j2-3-free-module-logged-out", page.locator('[data-cell="gap-output"]'), 140);
  await page.locator('[data-checkpoint="constraints-tested"] [data-action="mark-passed"]').click();
  await page.getByRole("dialog", { name: "Save your progress" }).waitFor();
  await shot(page, "j2-4-sign-in-to-save");
  await page.goto(`${base}/learn/pulse/delivery-receipts`);
  await shot(page, "j2-5-paywall");
  await ctx.close();
}

async function j3(browser: Browser) {
  const { ctx, page } = await learner(browser, "buyer", { country: "IN" });
  await page.goto(`${base}/learn/pulse/delivery-receipts`);
  await shot(page, "j3-1-paywall-inr", page.locator("[data-paywall]"), 220);
  await page.locator("[data-paywall]").getByRole("link", { name: /Get Pulse/ }).click();
  await page.waitForURL(/\/checkout/);
  await page.getByLabel("Plan").getByRole("radio", { name: "One project" }).click();
  await shot(page, "j3-2-checkout");
  await page.locator('[data-action="pay"]').click();
  await page.getByRole("dialog", { name: "Mock payment" }).waitFor();
  await shot(page, "j3-3-payment");
  await page.locator('[data-action="mock-pay"]').click();
  await page.waitForURL(/\/learn\/pulse\/delivery-receipts/, { timeout: 15_000 });
  await page.locator("[data-releasing-soon]").waitFor();
  await shot(page, "j3-4-back-unlocked");
  await ctx.close();
}

async function j4(browser: Browser) {
  const { ctx, page } = await learner(browser, "returning");
  // An earlier session: passed checkpoints and decisions in Foundations 1, then work in module 3.
  await page.request.post(`${base}/api/progress`, { data: { project: "foundations", module: "setup-agents", cellId: "cli-installed", kind: "checkpoint", status: "passed" } });
  await page.request.post(`${base}/api/progress`, { data: { project: "foundations", module: "setup-agents", cellId: "instructions-file", kind: "checkpoint", status: "passed" } });
  await page.request.post(`${base}/api/decisions`, {
    data: { project: "foundations", module: "setup-agents", cellId: "decision-instructions", isPublic: true, text: "I kept the rule about never editing tests, and cut the generic 'write clean code' advice the agent added. It wouldn't have changed anything it did." },
  });
  for (const cellId of ["intro", "failing-tests", "red-output"]) {
    await page.request.post(`${base}/api/progress`, { data: { project: "foundations", module: "tests-as-guardrails", cellId, kind: "touch" } });
    await page.waitForTimeout(30);
  }
  await page.goto(`${base}/dashboard`);
  await shot(page, "j4-1-dashboard");
  await page.locator("[data-continue]").getByRole("link", { name: "Continue" }).click();
  await page.waitForURL(/tests-as-guardrails/);
  await page.waitForTimeout(800);
  await page.evaluate(() => window.scrollBy(0, -90));
  await shot(page, "j4-2-resumed");
  await page.goto(`${base}/journal`);
  await shot(page, "j4-3-journal");
  await ctx.close();
}

async function j5(browser: Browser) {
  const { ctx, page } = await learner(browser, "stuck");
  await page.goto(`${base}/learn/foundations/tests-as-guardrails`);
  const pitfall = page.locator('[data-cell="pitfall-edits-tests"]');
  await pitfall.getByRole("button", { name: /edits the tests to make them pass/ }).click();
  await shot(page, "j5-1-pitfall", pitfall, 120);
  await pitfall.getByRole("button", { name: "Still stuck? Ask the tutor about this step" }).click();
  const drawer = page.getByRole("dialog", { name: "Notebook drawer" });
  await drawer.getByLabel("Message the tutor").fill("AssertionError: expected false to be true // Object.is equality\n ❯ test/rate-limit.test.ts:23:26");
  await drawer.getByRole("button", { name: "Send" }).click();
  await drawer.locator("[data-tutor-reply]").last().getByText("Recovery prompt").waitFor();
  await shot(page, "j5-2-tutor");
  for (let i = 0; i < 9; i++) {
    const r = await page.request.post(`${base}/api/tutor`, { data: { project: "foundations", module: "tests-as-guardrails", messages: [{ role: "user", content: `question ${i}` }] } });
    await r.body();
  }
  await drawer.getByLabel("Message the tutor").fill("One more question about the refill test");
  await drawer.getByRole("button", { name: "Send" }).click();
  await drawer.locator("[data-tutor-limit]").waitFor();
  await shot(page, "j5-3-daily-limit");
  await ctx.close();
}

const pulseModules = {
  "spec-and-system-design": { checkpoints: ["design-docs"], decisions: ["decision-architecture", "decision-transport"] },
  "repo-and-agent-setup": { checkpoints: ["workspace-green", "ci-green"], decisions: ["decision-repo"] },
  "data-model": { checkpoints: ["constraints-tested"], decisions: ["decision-receipts", "decision-gaps"] },
} as const;

const decisionText: Record<string, string> = {
  "decision-architecture": "The agent proposed Kafka and a separate presence service. I cut both: Postgres for history and Redis pub/sub between gateway nodes meet the v1 targets, and I noted the queue depth that would make me add Kafka back.",
  "decision-transport": "WebSockets over SSE: typing events and acks go both ways constantly. The cost I accept is stateful connections, so every gateway node subscribes to Redis for the conversations its sockets are in.",
  "decision-repo": "packages/shared holds only the zod protocol schemas and their types. Database code and React hooks stay in their apps, so the shared package never pulls server code into the client bundle.",
  "decision-receipts": "The agent proposed a receipts row per message. I switched to a per-conversation read cursor, so group reads are one write and 'read by 3' is a count over members.",
  "decision-gaps": "A gap in seq means the client missed something: it fetches the range it missed before rendering, instead of showing messages out of order. Gaps are rare after the retry fix, but the client never assumes there are none.",
};

async function j6(browser: Browser) {
  const ctx = await context(browser);
  const page = await ctx.newPage();
  await signIn(page, "email", `finisher-${stamp}@example.test`);
  await onboard(page);
  const handle = `asha-${String(stamp).slice(-5)}`;
  await page.request.post(`${base}/api/settings`, {
    data: { name: "Asha Example", handle, headline: "Backend engineer: real-time systems and payments", githubUsername: "asha-example", preferredTool: "claude", isPublic: true, marketingEmails: true },
  });
  for (const [module, req] of Object.entries(pulseModules)) {
    for (const cellId of req.checkpoints) await page.request.post(`${base}/api/progress`, { data: { project: "pulse", module, cellId, kind: "checkpoint", status: "passed" } });
    for (const cellId of req.decisions) await page.request.post(`${base}/api/decisions`, { data: { project: "pulse", module, cellId, text: decisionText[cellId], isPublic: true } });
  }
  await page.goto(`${base}/proof/pulse`);
  await page.getByLabel("GitHub repo").fill("https://github.com/asha-example/pulse-verify-pass");
  await page.getByRole("button", { name: "a mock deployment URL" }).click();
  await page.locator('[data-action="verify"]').click();
  await page.locator("[data-verified-badge]").waitFor();
  await page.waitForTimeout(3300);
  await shot(page, "j6-1-verification", page.locator("[data-checks]"), 320);
  await page.locator('[data-action="add-metric"]').click();
  await page.getByLabel("Metric 1 name", { exact: true }).fill("p95 message latency");
  await page.getByLabel("Metric 1 value", { exact: true }).fill("84 ms at 3,000 sockets");
  await page.locator('[data-action="add-metric"]').click();
  await page.getByLabel("Metric 2 name", { exact: true }).fill("Tests");
  await page.getByLabel("Metric 2 value", { exact: true }).fill("112 passing");
  const boxes = page.locator('section[aria-labelledby="step-3"] input[type="checkbox"]');
  await boxes.nth(0).check();
  await boxes.nth(1).check();
  await page.locator('[data-action="generate"]').click();
  await page.getByLabel("Bullet 1", { exact: true }).waitFor();
  await page.waitForTimeout(3500); // let the "All checks passed" toast go
  await page.getByLabel(/Architecture diagram/).fill("flowchart LR\n  W[Web client] -- WebSocket --> G[Gateway nodes]\n  G -- seq + insert --> P[(Postgres)]\n  G <-- pub/sub --> R[(Redis)]");
  await shot(page, "j6-2-draft", page.locator('section[aria-labelledby="step-4"]'), 40);
  await page.locator('[data-action="publish"]').click();
  await page.locator("[data-public-link]").waitFor();
  await page.locator("[data-public-link]").click();
  await page.waitForURL(new RegExp(`/u/${handle}/pulse`));
  await page.waitForTimeout(3500);
  await shot(page, "j6-3-public-proof-page");
  await ctx.close();
  return handle;
}

async function j7(browser: Browser, handle: string) {
  const ctx = await context(browser, { mobile: true });
  const page = await ctx.newPage();
  await page.goto(`${base}/u/${handle}`);
  await shot(page, "j7-1-profile-mobile");
  await page.goto(`${base}/u/${handle}/pulse`);
  await page.waitForTimeout(1500);
  await shot(page, "j7-2-project-mobile", page.getByRole("heading", { name: "Decisions" }), 60);
  await ctx.close();
}

async function j8(browser: Browser) {
  const ctx = await context(browser);
  const page = await ctx.newPage();
  await page.goto(`${base}/contact`);
  await page.getByLabel("Your name (required)").fill("Dr. Example");
  await page.getByLabel("Work email (required)").fill("hod@college.example");
  await page.getByLabel("Company or college (required)").fill("Example Institute of Technology");
  await page.getByLabel("This is for").selectOption("college");
  await page.getByLabel("Seats").fill("60");
  await shot(page, "j8-1-contact");
  await page.getByRole("button", { name: "Send" }).click();
  await page.locator("[data-contact-sent]").waitFor();
  await signIn(page, "admin");
  const created = await page.request.post(`${base}/api/admin/coupons`, {
    data: { kind: "grant", scope: "all", maxRedemptions: 60, expiresAt: new Date(Date.now() + 30 * 86_400_000).toISOString(), prefix: "EIT", count: 1 },
  });
  const code = ((await created.json()) as { codes: string[] }).codes[0]!;
  await ctx.close();

  const s = await learner(browser, "student");
  await s.page.goto(`${base}/pricing`);
  await s.page.getByLabel("Access code").fill(code);
  await s.page.getByRole("button", { name: "Redeem" }).click();
  await s.page.getByText("All six projects are unlocked on your account.").waitFor();
  await shot(s.page, "j8-2-code-redeemed", s.page.locator("[data-redeem]"), 420);
  await s.ctx.close();
}

async function j9(browser: Browser) {
  // A paid purchase and a refund so the admin tables have something to show.
  const b = await learner(browser, "admin-demo");
  const order = (await (await b.page.request.post(`${base}/api/checkout`, { data: { product: "pro-all", currency: "USD" } })).json()) as { orderId: string };
  const pay = (await (await b.page.request.post(`${base}/api/checkout/mock-pay`, { data: { orderId: order.orderId } })).json()) as { paymentId: string; signature: string };
  await b.page.request.post(`${base}/api/checkout/verify`, { data: { provider: "mock", ...pay, orderId: order.orderId } });
  await b.ctx.close();

  const ctx = await context(browser);
  const page = await ctx.newPage();
  await signIn(page, "admin");
  await page.goto(`${base}/admin`);
  await shot(page, "j9-1-admin-funnel");
  await shot(page, "j9-2-admin-purchases", page.getByRole("heading", { name: "Purchases" }), 80);
  await ctx.close();
}

async function main() {
  mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ executablePath });
  await j1(browser);
  await j2(browser);
  await j3(browser);
  await j4(browser);
  await j5(browser);
  const handle = await j6(browser);
  await j7(browser, handle);
  await j8(browser);
  await j9(browser);
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
