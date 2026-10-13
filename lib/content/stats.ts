import fs from "node:fs";
import path from "node:path";
import { CONTENT_DIR, loadGuide, previewDrafts, type LoadedQuestion } from "./load";

export interface Counts {
  questions: number;
  followUps: number;
  followUpsMin: number;
  followUpsMax: number;
  modules: number;
  /** Page counts come from the last `pnpm build:pdf`; null until a PDF has been built. */
  pages: { a4: number; phone: number } | null;
}

export interface GuideStats {
  version: string;
  reviewed: Counts;
  all: Counts;
}

export interface StatsFile {
  generatedAt: string;
  guides: Record<string, GuideStats>;
}

export const STATS_PATH = path.join(CONTENT_DIR, "stats.json");

export function countQuestions(questions: LoadedQuestion[], pages: Counts["pages"] = null): Counts {
  const per = questions.map((q) => q.follow_ups.length);
  return {
    questions: questions.length,
    followUps: per.reduce((a, b) => a + b, 0),
    followUpsMin: per.length ? Math.min(...per) : 0,
    followUpsMax: per.length ? Math.max(...per) : 0,
    modules: new Set(questions.map((q) => q.module)).size,
    pages,
  };
}

export function computeGuideStats(slug: string, previous?: GuideStats): GuideStats {
  const { meta, questions } = loadGuide(slug, { fresh: true });
  const reviewed = questions.filter((q) => q.reviewed);
  return {
    version: meta.version,
    reviewed: countQuestions(reviewed, previous?.reviewed.pages ?? null),
    all: countQuestions(questions, previous?.all.pages ?? null),
  };
}

export function readStatsFile(): StatsFile {
  if (!fs.existsSync(STATS_PATH)) return { generatedAt: new Date(0).toISOString(), guides: {} };
  return JSON.parse(fs.readFileSync(STATS_PATH, "utf8")) as StatsFile;
}

export function writeStatsFile(stats: StatsFile): void {
  fs.writeFileSync(STATS_PATH, JSON.stringify(stats, null, 2) + "\n");
}

const EMPTY: Counts = {
  questions: 0,
  followUps: 0,
  followUpsMin: 0,
  followUpsMax: 0,
  modules: 0,
  pages: null,
};

/**
 * The counts the site is allowed to print. They come from the build output (stats.json),
 * never from hand-typed copy. Draft counts are used only in content-preview mode.
 */
export function siteCounts(slug: string): Counts & { version: string } {
  const g = readStatsFile().guides[slug];
  if (!g) return { ...EMPTY, version: "0.0.0" };
  return { ...(previewDrafts() ? g.all : g.reviewed), version: g.version };
}

/** "4–5" or "4" when every question has the same number of follow-ups. */
export function followUpRange(c: Counts): string {
  if (c.followUpsMin === c.followUpsMax) return String(c.followUpsMin);
  return `${c.followUpsMin}–${c.followUpsMax}`;
}
