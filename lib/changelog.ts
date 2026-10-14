import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { z } from "zod";

const entry = z.object({
  version: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(["released", "in-review"]).default("released"),
  notes: z.array(z.string()).min(1),
});

const schema = z
  .object({
    errata: z
      .array(
        z.object({ guide: z.string(), question: z.string(), date: z.string(), fix: z.string() }),
      )
      .default([]),
  })
  .catchall(z.unknown());

export type ChangelogEntry = z.infer<typeof entry>;

export const CHANGELOG_PATH = path.join(process.cwd(), "content", "changelog.yaml");

export function readChangelog() {
  const raw = schema.parse(YAML.parse(fs.readFileSync(CHANGELOG_PATH, "utf8")));
  const guides: Record<string, ChangelogEntry[]> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (k === "errata") continue;
    guides[k] = z.array(entry).parse(v);
  }
  return { guides, errata: raw.errata };
}

export function lastUpdated(guide: string): string | undefined {
  return readChangelog().guides[guide]?.[0]?.date;
}
