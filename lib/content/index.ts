import "server-only";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { cache } from "react";
import { catalog, getProject, type CatalogProject } from "@/content/catalog";
import { parseModule, type ParsedModule } from "./parse";
import type { CellMeta, Frontmatter } from "./schema";

const ROOT = path.join(process.cwd(), "content", "projects");

export interface ModuleEntry extends ParsedModule {
  file: string;
}

export const loadProjectModules = cache((project: string): ModuleEntry[] => {
  const dir = path.join(ROOT, project);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".mdx"))
    .sort()
    .map((f) => {
      const file = path.join(dir, f);
      return { ...parseModule(readFileSync(file, "utf8"), `${project}/${f}`), file };
    })
    .sort((a, b) => a.frontmatter.order - b.frontmatter.order);
});

export function getModule(project: string, slug: string): ModuleEntry | undefined {
  return loadProjectModules(project).find((m) => m.frontmatter.slug === slug);
}

export interface ModuleSummary {
  slug: string;
  title: string;
  order: number;
  minutes: number;
  free: boolean;
  status: Frontmatter["status"];
  summary?: string;
  objectives: string[];
  requiredCheckpoints: string[];
  decisions: string[];
  cellCount: number;
}

export function summarize(m: ParsedModule): ModuleSummary {
  return {
    slug: m.frontmatter.slug,
    title: m.frontmatter.title,
    order: m.frontmatter.order,
    minutes: m.frontmatter.minutes,
    free: m.frontmatter.free,
    status: m.frontmatter.status,
    summary: m.frontmatter.summary,
    objectives: m.frontmatter.objectives,
    requiredCheckpoints: m.cells.filter((c) => c.kind === "Checkpoint" && c.required).map((c) => c.id),
    decisions: m.cells.filter((c) => c.kind === "Decision").map((c) => c.id),
    cellCount: m.cells.length,
  };
}

export function projectSummaries(project: string): ModuleSummary[] {
  return loadProjectModules(project).map(summarize);
}

export function allProjectsWithModules(): (CatalogProject & { summaries: ModuleSummary[] })[] {
  return catalog.map((p) => ({ ...p, summaries: projectSummaries(p.slug) }));
}

export function findCell(project: string, module: string, cellId: string): { cell: CellMeta; before: CellMeta[] } | undefined {
  const m = getModule(project, module);
  if (!m) return undefined;
  const i = m.cells.findIndex((c) => c.id === cellId);
  if (i < 0) return undefined;
  return { cell: m.cells[i]!, before: m.cells.slice(Math.max(0, i - 2), i) };
}

export function nextModule(project: string, slug: string): ModuleSummary | undefined {
  const list = projectSummaries(project);
  const i = list.findIndex((m) => m.slug === slug);
  return i >= 0 ? list[i + 1] : undefined;
}

export { getProject };
