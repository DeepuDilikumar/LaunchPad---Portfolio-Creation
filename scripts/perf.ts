/** LCP + initial JS for a page under throttled 4G and 4x CPU (same profile as the J7 journey). */
import { chromium, devices } from "@playwright/test";

const base = process.env.BASE_URL ?? "http://localhost:3200";
const paths = process.argv.slice(2).length ? process.argv.slice(2) : ["/"];

async function main() {
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
  for (const p of paths) {
    const runs: number[] = [];
    let js = 0;
    for (let i = 0; i < 3; i++) {
      const ctx = await browser.newContext({ ...devices["Pixel 7"] });
      await ctx.addCookies([{ name: "bp_consent", value: "essential", url: base }]);
      const page = await ctx.newPage();
      const cdp = await ctx.newCDPSession(page);
      await cdp.send("Network.enable");
      await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 150, downloadThroughput: (9 * 1024 * 1024) / 8, uploadThroughput: (1.5 * 1024 * 1024) / 8 });
      await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
      let bytes = 0;
      cdp.on("Network.loadingFinished", () => {});
      const types = new Map<string, string>();
      cdp.on("Network.responseReceived", (e) => types.set(e.requestId, e.type));
      cdp.on("Network.loadingFinished", (e) => {
        if (types.get(e.requestId) === "Script") bytes += e.encodedDataLength;
      });
      await page.addInitScript(() => {
        (window as unknown as { __lcp: number }).__lcp = 0;
        new PerformanceObserver((l) => {
          for (const e of l.getEntries()) (window as unknown as { __lcp: number }).__lcp = e.startTime;
        }).observe({ type: "largest-contentful-paint", buffered: true });
      });
      await page.goto(base + p, { waitUntil: "load" });
      await page.waitForTimeout(1500);
      runs.push(await page.evaluate(() => (window as unknown as { __lcp: number }).__lcp));
      // Initial JS = scripts loaded by the time of the load event (lazy demo chunks excluded by waiting only for load).
      js = bytes;
      await ctx.close();
    }
    runs.sort((a, b) => a - b);
    console.log(`${p}  LCP median ${Math.round(runs[1]!)}ms (runs: ${runs.map(Math.round).join(", ")})  JS transferred ${(js / 1024).toFixed(0)} KB`);
  }
  await browser.close();
}
main();
