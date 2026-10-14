import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import YAML from "yaml";
import { loadGuide, previewDrafts } from "../content/load";
import type { LoadIssue } from "../content/load";
import {
  cloudMapSchema,
  roadmapSchema,
  topicSchema,
  type CloudEntry,
  type CloudMap,
  type Roadmap,
  type Topic,
} from "./schema";

export const ROADMAP_DIR = path.join(process.cwd(), "content", "roadmap");

export interface LoadedRoadmap {
  roadmap: Roadmap;
  topics: Topic[];
  cloud: CloudMap;
  issues: LoadIssue[];
}

export function sectionTopicIds(section: Roadmap["sections"][number]): string[] {
  return [...section.left, ...section.right].flatMap((it) =>
    typeof it === "string" ? [it] : it.topics,
  );
}

const cache = new Map<string, LoadedRoadmap>();

/** Loads a roadmap, its topic files and the cloud map. Problems are reported, never thrown. */
export function loadRoadmap(slug = "system-design", opts: { fresh?: boolean } = {}): LoadedRoadmap {
  if (!opts.fresh && cache.has(slug)) return cache.get(slug)!;
  const dir = path.join(ROADMAP_DIR, slug);
  const roadmap = roadmapSchema.parse(
    YAML.parse(fs.readFileSync(path.join(dir, "roadmap.yaml"), "utf8")),
  );
  const cloud = cloudMapSchema.parse(
    JSON.parse(fs.readFileSync(path.join(ROADMAP_DIR, "cloud-map.json"), "utf8")),
  );
  const issues: LoadIssue[] = [];
  const topics: Topic[] = [];

  const topicDir = path.join(dir, "topics");
  for (const f of fs
    .readdirSync(topicDir)
    .filter((x) => x.endsWith(".md"))
    .sort()) {
    const rel = path.relative(process.cwd(), path.join(topicDir, f));
    const parsed = topicSchema.safeParse(
      matter(fs.readFileSync(path.join(topicDir, f), "utf8")).data,
    );
    if (!parsed.success) {
      for (const i of parsed.error.issues)
        issues.push({ file: rel, message: `${i.path.join(".") || "(file)"}: ${i.message}` });
      continue;
    }
    if (`${parsed.data.id}.md` !== f)
      issues.push({ file: rel, message: `file name must match id "${parsed.data.id}"` });
    topics.push(parsed.data);
  }

  const byId = new Map(topics.map((t) => [t.id, t]));
  const placed = new Map<string, string>();
  for (const s of roadmap.sections) {
    for (const id of sectionTopicIds(s)) {
      const t = byId.get(id);
      if (!t)
        issues.push({
          file: `${slug}/roadmap.yaml`,
          message: `section ${s.id} lists unknown topic "${id}"`,
        });
      else if (t.section !== s.id)
        issues.push({
          file: `${slug}/topics/${id}.md`,
          message: `section is "${t.section}" but roadmap.yaml places it in "${s.id}"`,
        });
      if (placed.has(id))
        issues.push({ file: `${slug}/roadmap.yaml`, message: `topic "${id}" appears twice` });
      placed.set(id, s.id);
    }
  }
  for (const t of topics) {
    if (!placed.has(t.id))
      issues.push({ file: `${slug}/topics/${t.id}.md`, message: "topic is not placed on the map" });
    if (t.cloud && !cloud.concepts[t.cloud])
      issues.push({ file: `${slug}/topics/${t.id}.md`, message: `unknown cloud key "${t.cloud}"` });
    for (const r of t.related)
      if (!byId.has(r))
        issues.push({ file: `${slug}/topics/${t.id}.md`, message: `unknown related topic "${r}"` });
  }
  const guideIds = new Set(loadGuide("backend").questions.map((q) => q.id));
  for (const t of topics) {
    for (const q of t.questions) {
      if (q.guide_ref && !guideIds.has(q.guide_ref))
        issues.push({
          file: `${slug}/topics/${t.id}.md`,
          message: `guide_ref "${q.guide_ref}" is not a guide question`,
        });
    }
  }

  const loaded = { roadmap, topics, cloud, issues };
  cache.set(slug, loaded);
  return loaded;
}

/** Topics whose content the site may show: reviewed only, unless draft preview is on. */
export function topicVisible(t: Topic): boolean {
  return t.reviewed || previewDrafts();
}

export function cloudFor(t: Topic, cloud: CloudMap): CloudEntry | null {
  return t.cloud ? (cloud.concepts[t.cloud] ?? null) : null;
}

export function topicHref(id: string): string {
  return `/roadmap/system-design/${id}`;
}
