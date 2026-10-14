/**
 * Publishes a guide version: uploads the built PDFs as the delivery masters, records the version in
 * the changelog, and (with --notify) emails every existing buyer a fresh download link.
 *
 *   pnpm build:pdf && pnpm release --guide backend --notes "Added 10 caching questions" [--notify]
 *   pnpm release --guide backend --drafts      # dev only: upload the review copy to local storage
 */
import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { loadEnv } from "./lib/env";

loadEnv();

const args = process.argv.slice(2);
const flag = (n: string) => args.includes(`--${n}`);
const opt = (n: string) => (args.includes(`--${n}`) ? args[args.indexOf(`--${n}`) + 1] : undefined);

async function main() {
  const { getStorage, masterKey } = await import("../lib/storage");
  const { loadGuideMeta } = await import("../lib/content/load");
  const { CHANGELOG_PATH } = await import("../lib/changelog");

  const guide = opt("guide") ?? "backend";
  const drafts = flag("drafts");
  const usingR2 = Boolean(process.env.R2_BUCKET);
  if (drafts && usingR2)
    throw new Error("Refusing to upload a review copy with drafts to production storage.");
  const meta = loadGuideMeta(guide);
  const storage = getStorage();

  for (const edition of ["a4", "phone"] as const) {
    const file = path.join(
      "dist",
      "pdf",
      `${guide}-v${meta.version}-${edition}${drafts ? "-review-copy" : ""}.pdf`,
    );
    if (!fs.existsSync(file))
      throw new Error(`${file} not found. Run pnpm build:pdf${drafts ? " --drafts" : ""} first.`);
    const bytes = new Uint8Array(fs.readFileSync(file));
    await storage.put(`masters/${guide}/v${meta.version}-${edition}.pdf`, bytes, "application/pdf");
    await storage.put(masterKey(guide, edition), bytes, "application/pdf");
    console.log(
      `uploaded ${file} → ${masterKey(guide, edition)} (${usingR2 ? "R2" : "local .data/storage"})`,
    );
  }

  const notes = opt("notes");
  if (notes && !drafts) {
    const doc = YAML.parseDocument(fs.readFileSync(CHANGELOG_PATH, "utf8"));
    const list = (doc.get(guide) as YAML.YAMLSeq | undefined) ?? new YAML.YAMLSeq();
    const today = new Date().toISOString().slice(0, 10);
    const existing = list.items.findIndex(
      (i) => (i as YAML.YAMLMap).get("version") === meta.version,
    );
    const item = doc.createNode({
      version: meta.version,
      date: today,
      status: "released",
      notes: [notes],
    });
    if (existing >= 0) list.items[existing] = item;
    else list.items.unshift(item);
    doc.set(guide, list);
    fs.writeFileSync(CHANGELOG_PATH, doc.toString());
    console.log(`changelog: ${guide} v${meta.version} (${today})`);
  }

  if (flag("notify")) {
    const { notifyBuyersOfUpdate } = await import("../lib/updates");
    const sent = await notifyBuyersOfUpdate(
      guide,
      meta.version,
      notes ?? "Fixes and improvements.",
    );
    console.log(`update emails sent: ${sent}`);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
