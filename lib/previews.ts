import fs from "node:fs";
import path from "node:path";
import { previewDrafts } from "./content/load";
import type { PreviewImage } from "@/components/product/SamplePages";

/** Page images exported by `pnpm build:previews`. Draft previews only in content-preview mode. */
export function previewImages(slug: string): PreviewImage[] {
  const dirs = previewDrafts() ? [`${slug}-drafts`, slug] : [slug];
  for (const d of dirs) {
    const f = path.join(process.cwd(), "public", "previews", d, "manifest.json");
    if (fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, "utf8")) as PreviewImage[];
  }
  return [];
}
