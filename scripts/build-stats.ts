/** Writes content/stats.json: the only place the site gets its numbers from. */
import { listGuideSlugs } from "../lib/content/load";
import {
  computeGuideStats,
  readStatsFile,
  writeStatsFile,
  type StatsFile,
} from "../lib/content/stats";

const previous = readStatsFile();
const next: StatsFile = { generatedAt: new Date().toISOString(), guides: {} };
for (const slug of listGuideSlugs()) {
  next.guides[slug] = computeGuideStats(slug, previous.guides[slug]);
  const r = next.guides[slug].reviewed;
  const a = next.guides[slug].all;
  console.log(
    `${slug} v${next.guides[slug].version}: reviewed ${r.questions} questions / ${r.followUps} follow-ups; drafts included ${a.questions} / ${a.followUps}`,
  );
}
// Only touch generatedAt when the numbers change, so CI can check stats.json is current.
if (JSON.stringify(previous.guides) === JSON.stringify(next.guides))
  next.generatedAt = previous.generatedAt;
writeStatsFile(next);
