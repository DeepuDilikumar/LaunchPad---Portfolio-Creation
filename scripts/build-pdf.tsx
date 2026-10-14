/**
 * Renders reviewed questions into the A4 and phone PDF editions.
 *   pnpm build:pdf                 reviewed questions only (what ships)
 *   pnpm build:pdf --drafts        review copy including drafts, marked as such
 *   pnpm build:pdf --guide backend
 * Prints the true counts and writes page counts into content/stats.json.
 */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { PDFDocument } from "pdf-lib";
import { site } from "../config/site";
import { listGuideSlugs, loadGuide } from "../lib/content/load";
import { computeGuideStats, readStatsFile, writeStatsFile } from "../lib/content/stats";
import { GuideDocument } from "../pdf/Document";
import { documentHtml, editions, type EditionName } from "../pdf/html";
import { launchBrowser } from "./lib/browser";

const args = process.argv.slice(2);
const drafts = args.includes("--drafts");
const guideArg = args.includes("--guide") ? args[args.indexOf("--guide") + 1] : undefined;
const outDir = path.join(process.cwd(), "dist", "pdf");

export function pdfFileName(
  slug: string,
  version: string,
  edition: EditionName,
  isDraft: boolean,
): string {
  return `${slug}-v${version}-${edition}${isDraft ? "-review-copy" : ""}.pdf`;
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await launchBrowser();
  const stats = readStatsFile();
  let failed = false;

  for (const slug of guideArg ? [guideArg] : listGuideSlugs()) {
    const { meta, questions, issues } = loadGuide(slug, { fresh: true });
    if (issues.length) {
      console.error(
        `${slug}: content has ${issues.length} validation issue(s). Run pnpm content:validate.`,
      );
      failed = true;
      continue;
    }
    const selected = drafts ? questions : questions.filter((q) => q.reviewed);
    if (selected.length === 0) {
      console.error(`${slug}: no reviewed questions yet. Use --drafts for a review copy.`);
      failed = true;
      continue;
    }
    const pages: Record<EditionName, number> = { a4: 0, phone: 0 };

    for (const edition of Object.keys(editions) as EditionName[]) {
      const body = renderToStaticMarkup(
        <GuideDocument
          meta={meta}
          questions={selected}
          edition={edition}
          brand={site.name}
          logoMark={site.logoMark}
          author={site.author.named ? site.author.name : site.name}
          supportEmail={site.support.email}
          siteUrl={site.url}
          drafts={drafts}
        />,
      );
      const htmlPath = path.join(outDir, `.${slug}-${edition}.html`);
      fs.writeFileSync(htmlPath, documentHtml(body, edition, meta.title));

      const page = await browser.newPage();
      await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);
      const e = editions[edition];
      const file = path.join(outDir, pdfFileName(slug, meta.version, edition, drafts));
      await page.pdf({
        path: file,
        width: e.width,
        height: e.height,
        margin: e.margin,
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: drafts
          ? `<div style="width:100%;font-family:monospace;font-size:7px;color:#9a2f1f;padding:0 ${e.margin.right};text-align:right">REVIEW COPY · CONTAINS UNREVIEWED DRAFTS</div>`
          : "<span></span>",
        // Page number on the right; the buyer stamp is added on the left at delivery.
        footerTemplate: `<div style="width:100%;font-family:monospace;font-size:7px;color:#a39a88;padding:0 ${e.margin.right};text-align:right"><span class="pageNumber"></span></div>`,
      });
      await page.close();
      fs.rmSync(htmlPath);

      const pdf = await PDFDocument.load(fs.readFileSync(file));
      pdf.setTitle(`${meta.title} v${meta.version}`);
      pdf.setAuthor(site.author.named ? site.author.name : site.name);
      pdf.setProducer(site.name);
      fs.writeFileSync(file, await pdf.save());
      pages[edition] = pdf.getPageCount();
      console.log(`  ${path.relative(process.cwd(), file)} · ${pages[edition]} pages`);
    }

    const follow = selected.reduce((n, q) => n + q.follow_ups.length, 0);
    console.log(
      `${slug} v${meta.version}: ${selected.length} questions, ${follow} follow-ups, A4 ${pages.a4} pages, phone ${pages.phone} pages${drafts ? " (review copy with drafts)" : ""}`,
    );

    const g = computeGuideStats(slug, stats.guides[slug]);
    if (drafts) g.all.pages = pages;
    else g.reviewed.pages = pages;
    stats.guides[slug] = g;
  }

  await browser.close();
  stats.generatedAt = new Date().toISOString();
  writeStatsFile(stats);
  if (failed) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
