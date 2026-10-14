import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { fontStylesheets } from "./fonts";

const require = createRequire(import.meta.url);
const root = process.cwd();

export const editions = {
  a4: {
    width: "210mm",
    height: "297mm",
    margin: { top: "16mm", right: "16mm", bottom: "20mm", left: "16mm" },
    pageH: "261mm",
    viewport: { width: 794, height: 1123 },
  },
  phone: {
    width: "100mm",
    height: "178mm",
    margin: { top: "8mm", right: "7mm", bottom: "12mm", left: "7mm" },
    pageH: "158mm",
    viewport: { width: 378, height: 673 },
  },
} as const;

export type EditionName = keyof typeof editions;

function css(file: string): string {
  return fs.readFileSync(path.join(root, file), "utf8");
}

/** Wraps rendered markup in a standalone HTML document with self-hosted fonts. */
export function documentHtml(body: string, edition: EditionName, title: string): string {
  const fontLinks = fontStylesheets
    .map((f) => `<link rel="stylesheet" href="${pathToFileURL(require.resolve(f)).href}">`)
    .join("\n");
  const e = editions[edition];
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>${title}</title>
${fontLinks}
<style>
${css("styles/tokens.css")}
${css("styles/question-page.css")}
${css("pdf/print.css")}
:root { --page-h: ${e.pageH}; }
@page { size: ${e.width} ${e.height}; margin: ${e.margin.top} ${e.margin.right} ${e.margin.bottom} ${e.margin.left}; }
</style></head>
<body>${body}</body></html>`;
}
