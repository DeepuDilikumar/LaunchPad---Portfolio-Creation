/** Screenshot each <section> of a page separately. Usage: tsx scripts/shoot-sections.ts /path [width] */
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const base = process.env.BASE_URL ?? "http://localhost:3000";
const path = process.argv[2] ?? "/";
const width = Number(process.argv[3] ?? 1440);
const out = process.env.OUT ?? "screenshots/sections";

async function main() {
  mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: process.env.REDUCED ? "reduce" : "no-preference" });
  if (process.env.CONSENT) await ctx.addCookies([{ name: "bp_consent", value: "essential", url: base }]);
  const page = await ctx.newPage();
  await page.goto(base + path, { waitUntil: "networkidle" });
  const sections = await page.locator("main section").all();
  let i = 0;
  for (const s of sections) {
    await s.scrollIntoViewIfNeeded();
    await page.waitForTimeout(Number(process.env.WAIT ?? 1500));
    const file = `${out}/${path.replace(/\//g, "_") || "root"}-${width}-${String(i++).padStart(2, "0")}.png`;
    await s.screenshot({ path: file });
    console.log(file);
  }
  await browser.close();
}
main();
