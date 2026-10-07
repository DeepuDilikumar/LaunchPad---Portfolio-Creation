/**
 * Validate every module: frontmatter (zod), unique cell ids, catalog agreement, and the
 * authoring minimums for published modules. Exits non-zero on any error.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { catalog, moduleFileName } from "../content/catalog";
import { parseModule } from "../lib/content/parse";

const root = path.join(process.cwd(), "content", "projects");
const errors: string[] = [];
const warnings: string[] = [];
let published = 0;
let outlines = 0;

for (const project of catalog) {
  const dir = path.join(root, project.slug);
  if (!existsSync(dir)) {
    errors.push(`${project.slug}: missing directory`);
    continue;
  }
  const files = readdirSync(dir).filter((f) => f.endsWith(".mdx"));
  for (const m of project.modules) {
    const name = moduleFileName(m);
    if (!files.includes(name)) errors.push(`${project.slug}: missing ${name}`);
  }
  for (const f of files) {
    try {
      const parsed = parseModule(readFileSync(path.join(dir, f), "utf8"), `${project.slug}/${f}`);
      const fm = parsed.frontmatter;
      const cm = project.modules.find((m) => m.slug === fm.slug);
      if (!cm) errors.push(`${project.slug}/${f}: slug "${fm.slug}" not in catalog`);
      else {
        if (cm.order !== fm.order) errors.push(`${project.slug}/${f}: order ${fm.order} ≠ catalog ${cm.order}`);
        if (cm.free !== fm.free) errors.push(`${project.slug}/${f}: free ${fm.free} ≠ catalog ${cm.free}`);
        if (moduleFileName(cm) !== f) errors.push(`${project.slug}/${f}: file name should be ${moduleFileName(cm)}`);
      }
      if (fm.project !== project.slug) errors.push(`${project.slug}/${f}: project "${fm.project}" mismatch`);
      if (fm.status === "published") {
        published++;
        const count = (k: string) => parsed.cells.filter((c) => c.kind === k).length;
        if (parsed.cells.length < 15) warnings.push(`${project.slug}/${f}: ${parsed.cells.length} cells (target 15–30)`);
        if (!parsed.cells.some((c) => c.kind === "Checkpoint" && c.required)) errors.push(`${project.slug}/${f}: needs a required Checkpoint`);
        if (count("Decision") < 1) errors.push(`${project.slug}/${f}: needs a Decision`);
        if (count("Pitfall") < 1) errors.push(`${project.slug}/${f}: needs a Pitfall`);
        if (count("Interview") < 2) warnings.push(`${project.slug}/${f}: ${count("Interview")} Interview cells (target 2)`);
        if (parsed.cells[0]?.kind !== "Explain") errors.push(`${project.slug}/${f}: first cell must be Explain (used as the paywall teaser)`);
        for (const c of parsed.cells) {
          if (["Prompt", "Checkpoint", "Decision", "Pitfall"].includes(c.kind) && /^[a-z]+-\d+$/.test(c.id)) {
            errors.push(`${project.slug}/${f}: ${c.kind} needs an explicit stable id`);
          }
        }
      } else outlines++;
    } catch (e) {
      errors.push((e as Error).message);
    }
  }
}

for (const w of warnings) console.warn("warn ", w);
for (const e of errors) console.error("error", e);
console.log(`content: ${published} published, ${outlines} outlines, ${errors.length} errors, ${warnings.length} warnings`);
process.exit(errors.length ? 1 : 0);
