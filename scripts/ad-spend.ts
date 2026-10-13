/**
 * Record ad spend so the weekly report can compute cost per order.
 *   pnpm ad-spend add 2026-11-08 1000 "reel-a" ["note"]
 *   pnpm ad-spend list [from] [to]
 */
import { loadEnv } from "./lib/env";

loadEnv();

async function main() {
  const { getStore } = await import("../lib/db");
  const [cmd, a, b, c, d] = process.argv.slice(2);
  const store = getStore();
  if (cmd === "add") {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(a ?? "") || !(Number(b) > 0) || !c)
      throw new Error('usage: pnpm ad-spend add <YYYY-MM-DD> <rupees> "<campaign>" ["note"]');
    const row = await store.addAdSpend({
      date: a,
      amount: Math.round(Number(b)),
      campaign: c,
      note: d ?? null,
    });
    console.log("added", row);
  } else if (cmd === "list") {
    console.table(await store.listAdSpend(a ?? "2000-01-01", b ?? "2100-01-01"));
  } else {
    console.log('usage: pnpm ad-spend add <YYYY-MM-DD> <rupees> "<campaign>" | list [from] [to]');
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
