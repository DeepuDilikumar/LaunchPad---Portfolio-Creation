/**
 * Phase 0: captures competitor pages once, for understanding layout only. Nothing in them is
 * copied. Output goes to reference/helpmeswitch/ (git-ignored, never deployed).
 *   pnpm capture-reference
 */
import { devices } from "playwright";
import { mkdir } from "node:fs/promises";
import { launchBrowser } from "./lib/browser";

const pages: Record<string, string> = {
  home: "https://helpmeswitch.in/",
  guides: "https://helpmeswitch.in/playbooks/",
  "hld-lld-kit": "https://helpmeswitch.in/playbooks/system-design-interview-guide/",
  backend: "https://helpmeswitch.in/playbooks/backend-interview-playbook/",
  behavioural: "https://helpmeswitch.in/playbooks/behavioural-interview-playbook/",
  methodology: "https://helpmeswitch.in/methodology/",
};

const viewports = {
  phone: { ...devices["iPhone 13"] },
  desktop: { viewport: { width: 1280, height: 800 } },
};

async function main() {
  const outDir = "reference/helpmeswitch";
  await mkdir(outDir, { recursive: true });
  const browser = await launchBrowser();
  for (const [vpName, options] of Object.entries(viewports)) {
    const context = await browser.newContext(options);
    const page = await context.newPage();
    for (const [name, url] of Object.entries(pages)) {
      try {
        await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
        // Scroll through once so lazy-loaded images render.
        await page.evaluate(async () => {
          for (let y = 0; y < document.body.scrollHeight; y += 600) {
            window.scrollTo(0, y);
            await new Promise((r) => setTimeout(r, 150));
          }
          window.scrollTo(0, 0);
        });
        await page.screenshot({ path: `${outDir}/${name}-${vpName}.png`, fullPage: true });
        console.log(`✓ ${name}-${vpName}`);
      } catch (err) {
        console.error(`✗ ${name}-${vpName}: ${(err as Error).message}`);
      }
    }
    await context.close();
  }
  await browser.close();
}

main();
