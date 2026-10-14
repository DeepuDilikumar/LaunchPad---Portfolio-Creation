import type { LoadedQuestion, LoadIssue } from "./load";

function normalise(title: string): string[] {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

/** Jaccard similarity over word sets; 1 means the same words. */
export function titleSimilarity(a: string, b: string): number {
  const sa = new Set(normalise(a));
  const sb = new Set(normalise(b));
  if (sa.size === 0 || sb.size === 0) return 0;
  let shared = 0;
  for (const w of sa) if (sb.has(w)) shared++;
  return shared / (sa.size + sb.size - shared);
}

export const NEAR_DUPLICATE_THRESHOLD = 0.7;

export function nearDuplicateTitles(
  questions: Pick<LoadedQuestion, "id" | "title" | "file">[],
): LoadIssue[] {
  const issues: LoadIssue[] = [];
  for (let i = 0; i < questions.length; i++) {
    for (let j = i + 1; j < questions.length; j++) {
      const s = titleSimilarity(questions[i].title, questions[j].title);
      if (s >= NEAR_DUPLICATE_THRESHOLD) {
        issues.push({
          file: questions[j].file,
          message: `title is a near-duplicate of ${questions[i].id} (similarity ${s.toFixed(2)})`,
        });
      }
    }
  }
  return issues;
}
