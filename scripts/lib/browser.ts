import fs from "node:fs";
import path from "node:path";
import { chromium, type Browser } from "playwright";

/** Launches Chromium, falling back to a preinstalled build when Playwright's own is missing. */
export async function launchBrowser(): Promise<Browser> {
  try {
    return await chromium.launch();
  } catch (err) {
    const base = process.env.PLAYWRIGHT_BROWSERS_PATH ?? "/opt/pw-browsers";
    const dir = fs.existsSync(base)
      ? fs.readdirSync(base).find((d) => /^chromium-\d+$/.test(d))
      : undefined;
    const exe = dir ? path.join(base, dir, "chrome-linux", "chrome") : undefined;
    if (!exe || !fs.existsSync(exe)) throw err;
    return chromium.launch({ executablePath: exe });
  }
}
