import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import YAML from "yaml";
import { guideMetaSchema, questionSchema, type GuideMeta, type Question } from "./schema";

export const CONTENT_DIR = path.join(process.cwd(), "content");
export const GUIDES_DIR = path.join(CONTENT_DIR, "guides");

export interface LoadedQuestion extends Question {
  file: string;
  moduleNumber: number;
  moduleTitle: string;
  /** Position inside its module, 1-based, by id order. */
  index: number;
  /** Display label like "Q 10.3". */
  label: string;
}

export interface LoadIssue {
  file: string;
  message: string;
}

export interface LoadedGuide {
  meta: GuideMeta;
  questions: LoadedQuestion[];
  issues: LoadIssue[];
}

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : e.name.endsWith(".md") ? [p] : [];
  });
}

export function listGuideSlugs(): string[] {
  if (!fs.existsSync(GUIDES_DIR)) return [];
  return fs
    .readdirSync(GUIDES_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory() && fs.existsSync(path.join(GUIDES_DIR, e.name, "guide.yaml")))
    .map((e) => e.name);
}

export function loadGuideMeta(slug: string): GuideMeta {
  const raw = fs.readFileSync(path.join(GUIDES_DIR, slug, "guide.yaml"), "utf8");
  return guideMetaSchema.parse(YAML.parse(raw));
}

const cache = new Map<string, LoadedGuide>();

/** Loads every question file in a guide. Invalid files are reported in `issues`, never thrown. */
export function loadGuide(slug: string, opts: { fresh?: boolean } = {}): LoadedGuide {
  if (!opts.fresh && cache.has(slug)) return cache.get(slug)!;
  const meta = loadGuideMeta(slug);
  const modules = new Map(meta.modules.map((m) => [m.slug, m]));
  const issues: LoadIssue[] = [];
  const parsed: Omit<LoadedQuestion, "index" | "label">[] = [];

  for (const file of walk(path.join(GUIDES_DIR, slug)).sort()) {
    const rel = path.relative(process.cwd(), file);
    let data: unknown;
    try {
      data = matter(fs.readFileSync(file, "utf8")).data;
    } catch (err) {
      issues.push({ file: rel, message: `frontmatter does not parse: ${(err as Error).message}` });
      continue;
    }
    const result = questionSchema.safeParse(data);
    if (!result.success) {
      for (const issue of result.error.issues) {
        issues.push({
          file: rel,
          message: `${issue.path.join(".") || "(file)"}: ${issue.message}`,
        });
      }
      continue;
    }
    const q = result.data;
    const mod = modules.get(q.module);
    if (!mod) {
      issues.push({ file: rel, message: `module "${q.module}" is not listed in guide.yaml` });
      continue;
    }
    if (q.guide !== slug)
      issues.push({ file: rel, message: `guide is "${q.guide}", expected "${slug}"` });
    if (!q.id.startsWith(`${meta.idPrefix}-`)) {
      issues.push({ file: rel, message: `id must start with "${meta.idPrefix}-"` });
    }
    if (path.basename(file, ".md") !== q.id) {
      issues.push({ file: rel, message: `file name must match id "${q.id}"` });
    }
    const expectedDir = path.join(GUIDES_DIR, slug, q.module);
    if (path.dirname(file) !== expectedDir) {
      issues.push({ file: rel, message: `file must live in content/guides/${slug}/${q.module}/` });
    }
    parsed.push({ ...q, file: rel, moduleNumber: mod.number, moduleTitle: mod.title });
  }

  const seen = new Set<string>();
  for (const q of parsed) {
    if (seen.has(q.id)) issues.push({ file: q.file, message: `duplicate id ${q.id}` });
    seen.add(q.id);
  }

  parsed.sort((a, b) => a.moduleNumber - b.moduleNumber || a.id.localeCompare(b.id));
  const counters = new Map<number, number>();
  const questions: LoadedQuestion[] = parsed.map((q) => {
    const index = (counters.get(q.moduleNumber) ?? 0) + 1;
    counters.set(q.moduleNumber, index);
    return { ...q, index, label: `Q ${q.moduleNumber}.${index}` };
  });

  const guide = { meta, questions, issues };
  cache.set(slug, guide);
  return guide;
}

/** Whether unreviewed drafts may be shown. Never true for the PDF build unless asked for. */
export function previewDrafts(): boolean {
  return process.env.NEXT_PUBLIC_CONTENT_PREVIEW === "1";
}

/** Questions the site may show: reviewed only, unless draft preview is on. */
export function publishedQuestions(slug: string): LoadedQuestion[] {
  const { questions } = loadGuide(slug);
  return previewDrafts() ? questions : questions.filter((q) => q.reviewed);
}

export function findQuestion(slug: string, id: string): LoadedQuestion | undefined {
  return publishedQuestions(slug).find((q) => q.id === id);
}
