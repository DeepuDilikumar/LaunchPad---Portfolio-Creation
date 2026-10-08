import "server-only";
import { createHighlighter, type Highlighter, type ThemeRegistrationRaw } from "shiki";

/** A Shiki theme built from our tokens: monochrome with the passed/failed/working accents. */
export const buildproofTheme: ThemeRegistrationRaw = {
  name: "buildproof",
  type: "dark",
  colors: { "editor.background": "#00000000", "editor.foreground": "#F5F5F5" },
  settings: [
    { settings: { foreground: "#F5F5F5", background: "#00000000" } },
    { scope: ["comment", "punctuation.definition.comment"], settings: { foreground: "#858585" } },
    { scope: ["string", "string.quoted", "markup.inline.raw"], settings: { foreground: "#C9C9C9" } },
    { scope: ["keyword", "storage", "storage.type", "keyword.control"], settings: { foreground: "#9B9B9B" } },
    { scope: ["entity.name.function", "support.function"], settings: { foreground: "#FFFFFF" } },
    { scope: ["constant.numeric", "constant.language"], settings: { foreground: "#E7A13A" } },
    { scope: ["entity.name.type", "support.type", "entity.name.class"], settings: { foreground: "#E7E7E7" } },
    { scope: ["variable", "variable.other"], settings: { foreground: "#F5F5F5" } },
    { scope: ["punctuation", "meta.brace"], settings: { foreground: "#8C8C8C" } },
    { scope: ["markup.inserted", "punctuation.definition.inserted"], settings: { foreground: "#3CCFB4" } },
    { scope: ["markup.deleted", "punctuation.definition.deleted"], settings: { foreground: "#EF5A4C" } },
    { scope: ["markup.changed"], settings: { foreground: "#E7A13A" } },
    { scope: ["meta.diff.header", "meta.diff.range"], settings: { foreground: "#9B9B9B" } },
  ],
};

const langs = ["ts", "tsx", "js", "json", "bash", "shell", "diff", "sql", "yaml", "md", "text"] as const;
let highlighter: Promise<Highlighter> | null = null;

function getHighlighter() {
  highlighter ??= createHighlighter({ themes: [buildproofTheme], langs: [...langs] });
  return highlighter;
}

export async function highlight(code: string, lang = "text"): Promise<string> {
  const h = await getHighlighter();
  const l = (langs as readonly string[]).includes(lang) ? lang : lang === "sh" || lang === "console" ? "bash" : "text";
  return h.codeToHtml(code, { lang: l, theme: "buildproof" });
}
