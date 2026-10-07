/** Print console errors/warnings and failed requests for given paths. */
import { chromium } from "@playwright/test";
const base = process.env.BASE_URL ?? "http://localhost:3000";
async function main() {
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
  const ctx = await browser.newContext({ reducedMotion: process.env.REDUCED ? "reduce" : "no-preference" });
  if (process.env.COOKIE) {
    for (const kv of process.env.COOKIE.split(";")) {
      const [name, value] = kv.split("=");
      await ctx.addCookies([{ name: name!.trim(), value: value!, url: base }]);
    }
  }
  const page = await ctx.newPage();
  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning") console.log(`[${m.type()}]`, m.text().slice(0, 600));
  });
  page.on("pageerror", (e) => console.log("[pageerror]", e.message));
  page.on("response", (r) => {
    if (r.status() >= 400) console.log("[http]", r.status(), r.url());
  });
  for (const p of process.argv.slice(2)) {
    console.log("==", p);
    await page.goto(base + p, { waitUntil: "networkidle" });
    await page.mouse.wheel(0, 3000);
    await page.waitForTimeout(1500);
  }
  await browser.close();
}
main();
