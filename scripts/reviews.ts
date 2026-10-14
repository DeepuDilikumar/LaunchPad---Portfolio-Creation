/**
 * Review moderation. Nothing is published without this step.
 *   pnpm reviews list [pending|published|rejected]
 *   pnpm reviews publish <id>
 *   pnpm reviews reject <id>
 */
import { loadEnv } from "./lib/env";

loadEnv();

async function main() {
  const { getStore } = await import("../lib/db");
  const [cmd, arg] = process.argv.slice(2);
  const store = getStore();
  if (cmd === "list" || !cmd) {
    const status = (arg as "pending" | "published" | "rejected" | undefined) ?? "pending";
    for (const r of await store.listReviews(status)) {
      console.log(
        `\n${r.id} · ${r.status} · ${r.rating}★ · ${r.name}, ${r.role}, ${r.years} yrs · order ${r.order_id} · consent ${r.consent_publish ? "yes" : "NO"}`,
      );
      console.log(`  “${r.body}”`);
    }
  } else if (cmd === "publish" || cmd === "reject") {
    if (!arg) throw new Error(`usage: pnpm reviews ${cmd} <id>`);
    const r = (await store.listReviews()).find((x) => x.id === arg);
    if (!r) throw new Error(`no review ${arg}`);
    if (cmd === "publish" && !r.consent_publish)
      throw new Error("This buyer didn't consent to publishing.");
    await store.setReviewStatus(arg, cmd === "publish" ? "published" : "rejected");
    console.log(
      `${arg} → ${cmd === "publish" ? "published" : "rejected"}. The site picks it up within an hour (ISR).`,
    );
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
