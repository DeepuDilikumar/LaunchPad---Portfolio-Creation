/**
 * Quality gates for guide content. Fails (exit 1) on any schema error, near-duplicate title,
 * or a source URL missing from content/sources.csv. Prints the true counts.
 */
import { listGuideSlugs, loadGuide } from "../lib/content/load";
import { nearDuplicateTitles } from "../lib/content/quality";
import { readSources } from "../lib/content/sources";

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

if (failed) {
  console.error("\nContent validation failed.");
  process.exit(1);
}
console.log("Content validation passed.");
