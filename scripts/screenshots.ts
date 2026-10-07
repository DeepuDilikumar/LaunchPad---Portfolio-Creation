/**
 * Screenshot pages at 390px and 1440px. Usage:
 *   BASE_URL=http://localhost:3000 tsx scripts/screenshots.ts / /styleguide
 * Options: FULL=1 for full-page, OUT=dir.
 */
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const base = process.env.BASE_URL ?? "http://localhost:3000";
const out = process.env.OUT ?? "screenshots";
const paths = process.argv.slice(2).length ? process.argv.slice(2) : ["/"];
const widths = (process.env.WIDTHS ?? "390,1440").split(",").map(Number);
const executablePath = process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

async function main() {
  mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ executablePath });
  for (const w of widths) {
    const ctx = await browser.newContext({
      viewport: { width: w, height: w < 600 ? 844 : 900 },
      deviceScaleFactor: 1,
      reducedMotion: process.env.REDUCED ? "reduce" : "no-preference",
    });
    if (process.env.COOKIE) {
      const [name, value] = process.env.COOKIE.split("=");
      await ctx.addCookies([{ name: name!, value: value!, url: base }]);
    }
    await ctx.addCookies([{ name: "bp_consent", value: "essential", url: base }]);
    const page = await ctx.newPage();
    if (process.env.SIGNIN) {
      const res = await page.request.post(base + "/api/auth/mock", { data: { method: process.env.SIGNIN, next: "/dashboard" } });
      if (!res.ok()) throw new Error("sign-in failed " + res.status());
      await page.request.post(base + "/api/onboarding", { data: { experienceLevel: "0-2", targetRole: "backend", preferredTool: "claude" } });
    }
    for (const p of paths) {
      await page.goto(base + p, { waitUntil: "networkidle" });
      await page.waitForTimeout(Number(process.env.WAIT ?? 1200));
      const name = `${out}/${(p.replace(/\//g, "_") || "_root").replace(/^_/, "") || "root"}-${w}.png`;
      await page.screenshot({ path: name, fullPage: process.env.FULL !== "0" });
      console.log("saved", name);
    }
    await ctx.close();
  }
  await browser.close();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
