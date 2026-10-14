/**
 * Exports chosen guide pages as WebP for the site's page viewer.
 *   pnpm build:previews            reviewed questions → public/previews/<slug>/
 *   pnpm build:previews --drafts   drafts included → public/previews/<slug>-drafts/ (preview mode only)
 */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import sharp from "sharp";
import { site } from "../config/site";
import { listGuideSlugs, loadGuide, type LoadedQuestion } from "../lib/content/load";
import { GuideDocument } from "../pdf/Document";
import { documentHtml } from "../pdf/html";
import { launchBrowser } from "./lib/browser";

const drafts = process.argv.includes("--drafts");
const MAX = 12;

export interface PreviewEntry {
  src: string;
  alt: string;
  width: number;
  height: number;
}

const screenCss = `
@media screen {
  body { background: #fffefa; }
  .page { width: 794px; height: 1123px; padding: 60px 60px 70px; box-sizing: border-box; overflow: hidden; position: relative; background: #fffefa; }
  .page::after { content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 90px; background: linear-gradient(rgba(255,254,250,0), #fffefa 80%); }
  .cover { min-height: 0; height: 1123px; }
}`;

function pickPages(questions: LoadedQuestion[], samples: string[]): { key: string; alt: string }[] {
  const picks = [
    { key: "cover", alt: "Cover page" },
    { key: "contents", alt: "Contents page" },
  ];
  const chosen = new Set<string>();
  for (const id of samples) {
    const q = questions.find((x) => x.id === id);
    if (q) chosen.add(q.id);
  }
  for (const q of questions) {
    if (chosen.size >= MAX - picks.length) break;
    if (![...chosen].some((id) => questions.find((x) => x.id === id)?.module === q.module))
      chosen.add(q.id);
  }
  for (const id of chosen) {
    const q = questions.find((x) => x.id === id)!;
    picks.push({ key: id, alt: `${q.label}: ${q.title}` });
  }
  return picks.slice(0, MAX);
}

async function main() {
  const browser = await launchBrowser();
  for (const slug of listGuideSlugs()) {
    const { meta, questions } = loadGuide(slug, { fresh: true });
    const selected = drafts ? questions : questions.filter((q) => q.reviewed);
    const outDir = path.join(process.cwd(), "public", "previews", drafts ? `${slug}-drafts` : slug);
    if (selected.length === 0) {
      console.warn(`${slug}: no reviewed questions; skipping previews.`);
      continue;
    }
    fs.rmSync(outDir, { recursive: true, force: true });
    fs.mkdirSync(outDir, { recursive: true });

    const body = renderToStaticMarkup(
      <GuideDocument
        meta={meta}
        questions={selected}
        edition="a4"
        brand={site.name}
        logoMark={site.logoMark}
        author={site.author.named ? site.author.name : site.name}
        supportEmail={site.support.email}
        siteUrl={site.url}
        drafts={drafts}
      />,
    );
    const htmlPath = path.join(outDir, ".preview.html");
    fs.writeFileSync(
      htmlPath,
      documentHtml(body, "a4", meta.title).replace("</style>", `${screenCss}</style>`),
    );
    const page = await browser.newPage({
      viewport: { width: 794, height: 1123 },
      deviceScaleFactor: 1.5,
    });
    await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);

    const manifest: PreviewEntry[] = [];
    const picks = pickPages(selected, meta.samples);
    for (const [i, pick] of picks.entries()) {
      const el = page.locator(`[data-preview="${pick.key}"]`).first();
      const png = await el.screenshot();
      const name = `${String(i + 1).padStart(2, "0")}-${pick.key}.webp`;
      const img = sharp(png).resize({ width: 900 }).webp({ quality: 78 });
      const { width, height } = await img.toFile(path.join(outDir, name));
      manifest.push({
        src: `/previews/${path.basename(outDir)}/${name}`,
        alt: pick.alt,
        width,
        height,
      });
    }
    await page.close();
    fs.rmSync(htmlPath);
    fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
    console.log(
      `${slug}: ${manifest.length} preview pages → ${path.relative(process.cwd(), outDir)}`,
    );
  }
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
