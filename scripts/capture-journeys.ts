/**
 * Walks each user journey in a running dev server and saves screenshots for the README.
 *
 *   NEXT_PUBLIC_CONTENT_PREVIEW=1 NEXT_PUBLIC_FEATURE_DRILL=1 pnpm dev -p 3300
 *   pnpm screenshots http://localhost:3300            # every journey
 *   pnpm screenshots http://localhost:3300 roadmap    # only the roadmap journey
 *
 * Needs dev mode (the simulated checkout) and a local delivery master
 * (`pnpm build:pdf --drafts && pnpm release --guide backend --drafts`).
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { devices, type Locator, type Page } from "playwright";
import sharp from "sharp";
import { signToken } from "../lib/ids";
import { launchBrowser } from "./lib/browser";

const base = process.argv[2] ?? "http://localhost:3000";
const only = process.argv[3];
const out = path.join(process.cwd(), "docs", "screenshots");
const outbox = path.join(process.cwd(), ".data", "outbox");
const buyer = "asha@example.com";
const lead = "ravi@example.com";

async function save(name: string, png: Buffer, width = 780) {
  await sharp(png)
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 78 })
    .toFile(path.join(out, `${name}.webp`));
  console.log(`✓ ${name}`);
}

/** Dev mode can abort the first navigation while it compiles a route; try once more. */
async function go(p: Page, url: string) {
  try {
    return await p.goto(url, { waitUntil: "networkidle" });
  } catch {
    return p.goto(url, { waitUntil: "networkidle" });
  }
}

const shot = async (p: Page, name: string, width?: number) =>
  save(name, await p.screenshot(), width);
const el = async (l: Locator, name: string, width?: number) =>
  save(name, await l.screenshot(), width);

function latestEmail(to: string): string {
  const files = fs
    .readdirSync(outbox)
    .filter((f) => f.endsWith(`${to}.html`))
    .sort();
  if (!files.length) throw new Error(`no email for ${to} in .data/outbox`);
  return path.join(outbox, files[files.length - 1]);
}

/**
 * The free System Design roadmap: map, drawer tabs, phone sheet, and the links from the guide.
 * Shots are written at the end: a file landing in the repo mid-journey makes the dev server
 * reload the page, which then shows the pushed topic URL instead of the open drawer.
 */
async function roadmapJourney(desktop: Page, phone: Page) {
  const map = `${base}/roadmap/system-design`;
  const shots: [string, Buffer, number][] = [];
  await desktop.setViewportSize({ width: 1440, height: 1000 });
  await go(desktop, map);
  await desktop.waitForTimeout(2000);
  await desktop.getByRole("button", { name: "14 days" }).click();
  shots.push(["roadmap-01-map-desktop", await desktop.screenshot(), 1440]);
  shots.push([
    "roadmap-02-map-full",
    await desktop.screenshot({ fullPage: true, clip: { x: 0, y: 0, width: 1440, height: 2600 } }),
    1440,
  ]);

  await desktop
    .getByRole("link", { name: /Layer 4 vs Layer 7/ })
    .first()
    .click();
  const drawer = desktop.getByRole("dialog");
  await drawer.waitFor();
  await drawer.getByRole("tab", { name: "They ask" }).click();
  await desktop.waitForTimeout(300);
  shots.push(["roadmap-03-drawer-they-ask", await desktop.screenshot(), 1440]);
  await drawer.getByRole("tab", { name: /Real world/ }).click();
  await desktop.waitForTimeout(300);
  shots.push(["roadmap-04-drawer-cloud", await desktop.screenshot(), 1440]);
  await desktop.keyboard.press("Escape");

  await go(phone, map);
  shots.push(["roadmap-05-map-phone", await phone.screenshot(), 780]);
  // Wait for hydration, or the tap follows the plain link to the topic page.
  await phone.waitForTimeout(2000);
  await phone
    .getByRole("link", { name: /Cache-aside/ })
    .first()
    .click();
  await phone.getByRole("dialog").waitFor();
  await phone.getByRole("dialog").getByRole("tab", { name: "They ask" }).click();
  await phone.waitForTimeout(300);
  shots.push(["roadmap-06-sheet-phone", await phone.screenshot(), 780]);

  await desktop.setViewportSize({ width: 1280, height: 860 });
  await go(desktop, `${base}/guides/backend#pages`);
  await desktop.waitForTimeout(800);
  shots.push(["roadmap-07-guide-nudge", await desktop.locator("#pages").screenshot(), 1280]);

  for (const [name, png, width] of shots) await save(name, png, width);
}

async function main() {
  fs.mkdirSync(out, { recursive: true });
  fs.rmSync(outbox, { recursive: true, force: true });
  const browser = await launchBrowser();
  const desktop = await (
    await browser.newContext({ viewport: { width: 1280, height: 860 } })
  ).newPage();
  const phone = await (await browser.newContext({ ...devices["iPhone 13"] })).newPage();
  // Emails are fixed-width HTML without a mobile viewport: shoot them like a mail client would.
  const mail = await (
    await browser.newContext({ viewport: { width: 640, height: 900 } })
  ).newPage();
  // Let any smooth scroll finish, then jump to the top.
  const top = async (p: Page) => {
    await p.waitForTimeout(1500);
    await p.evaluate(() => {
      document.documentElement.style.scrollBehavior = "auto";
      window.scrollTo(0, 0);
    });
    await p.waitForTimeout(200);
  };

  if (only === "roadmap") {
    await roadmapJourney(desktop, phone);
    await browser.close();
    return;
  }

  // ---------- 1. Buy the guide ----------
  await go(desktop, `${base}/`);
  await shot(desktop, "buy-01-home-desktop", 1280);
  await go(phone, `${base}/`);
  await shot(phone, "buy-02-home-phone");

  await go(phone, `${base}/guides/backend`);
  await shot(phone, "buy-03-product-price");

  const demo = phone.locator("#demo");
  await demo.scrollIntoViewIfNeeded();
  await demo.getByRole("button", { name: /^c\)/ }).click();
  await demo.getByRole("button", { name: /reveal the strong answer/ }).click();
  await el(demo, "buy-04-follow-up-demo");

  await go(desktop, `${base}/guides/backend#pages`);
  await desktop.getByRole("tab", { name: /queue keeps growing/ }).click();
  await save("buy-05-page-viewer", await desktop.locator("#pages").screenshot(), 1280);

  await go(phone, `${base}/guides/backend`);
  await phone.locator("#buy").getByRole("button", { name: "Get the guide" }).click();
  const panel = phone.getByRole("dialog", { name: "Simulated payment" });
  await panel.waitFor();
  await panel.getByLabel("Buyer email").fill(buyer);
  await el(phone.locator("#buy"), "buy-06-checkout");
  await panel.getByRole("button", { name: "Simulate successful payment" }).click();
  await phone.waitForURL(/thank-you/);
  await phone.getByText(/Sent to/).waitFor();
  const orderId = new URL(phone.url()).searchParams.get("order")!;
  await shot(phone, "buy-07-thank-you");

  const email = latestEmail(buyer);
  await mail.goto(pathToFileURL(email).href);
  await save("buy-08-delivery-email", await mail.screenshot({ fullPage: true }), 640);
  const html = fs.readFileSync(email, "utf8");
  const downloadUrl = html.match(/href="([^"]*\/download\?t=[^"]+)"/)![1].replace(/&amp;/g, "&");
  const token = new URL(downloadUrl).searchParams.get("t")!;

  await go(phone, `${base}/download?t=${encodeURIComponent(token)}`);
  await shot(phone, "buy-09-download-page");

  const res = await phone.request.get(
    `${base}/api/download?t=${encodeURIComponent(token)}&file=backend-phone`,
  );
  const pdfPath = path.join(out, ".stamped.pdf");
  fs.writeFileSync(pdfPath, await res.body());
  try {
    // The first page that opens a question: title, what it tests, start of the ladder.
    let pageNo = 1;
    for (let n = 1; n < 60; n++) {
      const text = execFileSync("pdftotext", [
        "-f",
        String(n),
        "-l",
        String(n),
        pdfPath,
        "-",
      ]).toString();
      if (/WHAT IT TESTS/i.test(text) && /FOLLOW-UP LADDER/i.test(text)) {
        pageNo = n;
        break;
      }
    }
    execFileSync("pdftoppm", [
      "-r",
      "110",
      "-png",
      "-f",
      String(pageNo),
      "-l",
      String(pageNo),
      "-singlefile",
      pdfPath,
      path.join(out, ".page"),
    ]);
    await save(
      "buy-10-stamped-pdf-phone-edition",
      fs.readFileSync(path.join(out, ".page.png")),
      520,
    );
    fs.rmSync(path.join(out, ".page.png"));
  } catch {
    console.warn("pdftoppm/pdftotext not found; skipping the PDF page screenshot");
  }
  fs.rmSync(pdfPath);

  // ---------- 2. Readiness Check ----------
  await go(phone, `${base}/check`);
  for (const l of ["2–4 yrs", "Backend", "In 1–4 weeks"])
    await phone.getByRole("button", { name: l, exact: true }).click();
  await shot(phone, "check-01-warm-up");
  await phone.getByRole("button", { name: /Start the check/ }).click();
  const picks = ["B", "C", "A", "B", "C", "A", "B", "A"];
  for (let i = 0; i < picks.length; i++) {
    await phone
      .getByRole("radio")
      .nth(picks[i].charCodeAt(0) - 65)
      .click();
    if (i === 6) await shot(phone, "check-02-question");
    await phone.getByRole("button", { name: /Next question|See my result/ }).click();
  }
  await phone.locator("h1", { hasText: "weak spot" }).waitFor();
  await top(phone);
  await shot(phone, "check-03-result");
  await phone.locator("#report-email").fill(lead);
  await phone.getByRole("checkbox").check();
  await phone.locator("#report-email").scrollIntoViewIfNeeded();
  await phone.getByRole("button", { name: "Send report" }).click();
  await phone.getByText(/Report sent/).waitFor();
  await el(phone.locator("form").filter({ hasText: "full report" }), "check-04-email-captured");
  await mail.goto(pathToFileURL(latestEmail(lead)).href);
  await save("check-05-report-email", await mail.screenshot({ fullPage: true }), 640);

  // ---------- 3. Free article (search traffic) ----------
  await go(phone, `${base}/learn/idempotency-interview-questions`);
  await shot(phone, "learn-01-article");

  // ---------- 4. Review and referral (day 7) ----------
  const reviewToken = signToken({ o: orderId, exp: Date.now() + 86400_000 });
  await go(phone, `${base}/review?t=${encodeURIComponent(reviewToken)}`);
  await phone.getByLabel(/First name/).fill("Asha");
  await phone.getByRole("textbox", { name: "Role" }).fill("Backend engineer, fintech");
  await phone
    .getByLabel("Your review")
    .fill(
      "The follow-up ladders were exactly where my last loop went quiet. The payments module alone was worth it.",
    );
  await shot(phone, "review-01-form");
  await phone.getByRole("button", { name: "Send review" }).click();
  await phone.getByText(/moderation queue/).waitFor();
  await top(phone);
  await shot(phone, "review-02-referral-link");

  // ---------- 5. AI follow-up drill (feature flag) ----------
  const drill = await go(phone, `${base}/drill`);
  if (drill?.ok()) await shot(phone, "drill-01-login");
  else console.warn("drill is off (NEXT_PUBLIC_FEATURE_DRILL); skipping");

  // ---------- 6. System Design roadmap ----------
  await roadmapJourney(desktop, phone);

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
