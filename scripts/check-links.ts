/** Checks every URL in content/sources.csv responds. Run in CI; flaky hosts can be retried. */
import fs from "node:fs";
import { readSources } from "../lib/content/sources";

async function check(url: string): Promise<string | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 15_000);
      let res = await fetch(url, {
        method: "HEAD",
        redirect: "follow",
        signal: ctrl.signal,
        headers: { "User-Agent": "Mozilla/5.0 link-check" },
      });
      if (res.status === 405 || res.status === 403)
        res = await fetch(url, {
          redirect: "follow",
          signal: ctrl.signal,
          headers: { "User-Agent": "Mozilla/5.0 link-check" },
        });
      clearTimeout(timer);
      // Some sites block bots with 403/429; that still proves the page exists.
      if (res.ok || res.status === 403 || res.status === 429) return null;
      if (attempt === 1) return `${res.status}`;
    } catch (err) {
      if (attempt === 1) return (err as Error).message;
    }
  }
  return null;
}

function cloudLinks(): { url: string }[] {
  const m = JSON.parse(fs.readFileSync("content/roadmap/cloud-map.json", "utf8")) as {
    concepts: Record<string, Record<string, { docUrl?: string }>>;
  };
  const urls = new Set<string>();
  for (const c of Object.values(m.concepts))
    for (const v of Object.values(c)) if (typeof v === "object" && v.docUrl) urls.add(v.docUrl);
  return [...urls].map((url) => ({ url }));
}

async function main() {
  const sources = [...readSources(), ...cloudLinks()];
  const results = await Promise.all(sources.map(async (s) => [s.url, await check(s.url)] as const));
  const broken = results.filter(([, e]) => e);
  for (const [url, e] of broken) console.error(`✗ ${url}: ${e}`);
  console.log(
    `${sources.length - broken.length}/${sources.length} links OK (sources + cloud docs)`,
  );
  if (broken.length) process.exit(1);
}

main();
