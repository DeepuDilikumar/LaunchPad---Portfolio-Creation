/**
 * Quality gates for guide content. Fails (exit 1) on any schema error, near-duplicate title,
 * or a source URL missing from content/sources.csv. Prints the true counts.
 */
import { listGuideSlugs, loadGuide } from "../lib/content/load";
import { nearDuplicateTitles } from "../lib/content/quality";
import { readSources } from "../lib/content/sources";
import { loadRoadmap } from "../lib/roadmap/load";

let failed = false;
const logged = new Set(readSources().map((s) => s.url));

for (const slug of listGuideSlugs()) {
  const { meta, questions, issues } = loadGuide(slug, { fresh: true });
  const all = [...issues, ...nearDuplicateTitles(questions)];

  for (const q of questions) {
    for (const url of q.sources) {
      if (!logged.has(url))
        all.push({ file: q.file, message: `source not logged in content/sources.csv: ${url}` });
    }
  }
  const ids = new Set(questions.map((q) => q.id));
  for (const id of [...meta.samples, meta.demo.question]) {
    if (!ids.has(id))
      all.push({ file: `content/guides/${slug}/guide.yaml`, message: `unknown question id ${id}` });
  }
  const demo = questions.find((q) => q.id === meta.demo.question);
  if (demo && !demo.follow_ups[meta.demo.followUpIndex]) {
    all.push({
      file: `content/guides/${slug}/guide.yaml`,
      message: "demo.followUpIndex is out of range",
    });
  }

  const reviewed = questions.filter((q) => q.reviewed).length;
  console.log(
    `${slug}: ${questions.length} questions (${reviewed} reviewed, ${questions.length - reviewed} drafts)`,
  );
  for (const issue of all) console.error(`  ✗ ${issue.file}: ${issue.message}`);
  if (all.length) failed = true;
}

// Roadmap: topics, placement, cloud keys, guide references, and guide → roadmap concept links.
{
  const rm = loadRoadmap("system-design", { fresh: true });
  const ids = new Set(rm.topics.map((t) => t.id));
  const all = [...rm.issues];
  for (const q of loadGuide("backend", { fresh: true }).questions) {
    for (const c of q.concepts ?? [])
      if (!ids.has(c)) all.push({ file: q.file, message: `concept "${c}" is not a roadmap topic` });
  }
  const ageDays = (Date.now() - Date.parse(`${rm.cloud.lastVerified}T00:00:00Z`)) / 86400_000;
  const full = rm.topics.filter((t) => t.questions.length).length;
  console.log(
    `roadmap/system-design: ${rm.topics.length} topics (${rm.topics.filter((t) => t.reviewed).length} reviewed, ${full} with interview questions)`,
  );
  if (ageDays > 120)
    console.warn(
      `  ! cloud-map.json lastVerified is ${Math.round(ageDays)} days old; re-check the services`,
    );
  for (const issue of all) console.error(`  ✗ ${issue.file}: ${issue.message}`);
  if (all.length) failed = true;
}

if (failed) {
  console.error("\nContent validation failed.");
  process.exit(1);
}
console.log("Content validation passed.");
