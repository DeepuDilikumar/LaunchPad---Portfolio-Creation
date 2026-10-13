import fs from "node:fs";
import path from "node:path";
import { CONTENT_DIR } from "./load";

export const SOURCES_PATH = path.join(CONTENT_DIR, "sources.csv");

export interface SourceRow {
  url: string;
  kind: string;
  notes: string;
}

/** Minimal CSV reader: url,kind,notes with optional double-quoted notes. */
export function readSources(): SourceRow[] {
  if (!fs.existsSync(SOURCES_PATH)) return [];
  const lines = fs.readFileSync(SOURCES_PATH, "utf8").split(/\r?\n/).filter(Boolean);
  return lines.slice(1).map((line) => {
    const m = line.match(/^([^,]+),([^,]*),(.*)$/);
    if (!m) return { url: line.trim(), kind: "", notes: "" };
    return { url: m[1].trim(), kind: m[2].trim(), notes: m[3].trim().replace(/^"|"$/g, "") };
  });
}
