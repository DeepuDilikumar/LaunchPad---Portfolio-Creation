import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";
import { z } from "zod";
import { followUpTypes } from "./content/schema";

const LEARN_DIR = path.join(process.cwd(), "content", "learn");

export const articleSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string(),
  description: z.string().max(200),
  keywords: z.array(z.string()).min(1),
  published: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  guide: z.string(),
  module: z.string(),
  primary: z.string(),
  follow_ups: z
    .array(
      z.object({ type: z.enum(followUpTypes), question: z.string(), what_it_tests: z.string() }),
    )
    .length(3),
  outline: z.array(z.string()).min(2),
});

export type Article = z.infer<typeof articleSchema> & { html: string };

export function listArticles(): Article[] {
  if (!fs.existsSync(LEARN_DIR)) return [];
  return fs
    .readdirSync(LEARN_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const { data, content } = matter(fs.readFileSync(path.join(LEARN_DIR, f), "utf8"));
      const meta = articleSchema.parse(data);
      if (`${meta.slug}.md` !== f) throw new Error(`content/learn/${f}: slug must match file name`);
      return { ...meta, html: marked.parse(content, { async: false }) as string };
    })
    .sort((a, b) => b.published.localeCompare(a.published));
}

export function getArticle(slug: string): Article | undefined {
  return listArticles().find((a) => a.slug === slug);
}
