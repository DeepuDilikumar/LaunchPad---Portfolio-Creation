/**
 * Interview-answer feedback. Coverage of each key point is judged by the LLM when available,
 * otherwise by keyword overlap. The rating is always computed here from the coverage, so the
 * student can see exactly why they got it.
 */

const STOP = new Set(
  "a an the and or but of to in on for with by at from as is are was were be been it its this that these those you your we our they their i my me so if then than into over under about how what why when which who can could would should will just also more most less very not no yes do does did use used using".split(
    " "
  )
)

function words(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, " ")
    .split(/\s+/)
    .map((w) => w.replace(/^[.-]+|[.-]+$/g, ""))
    .filter((w) => w.length > 2 && !STOP.has(w))
}

function stem(w: string) {
  return w.replace(/(ing|ed|es|s)$/, "")
}

/** A key point counts as covered when at least half of its meaningful words appear in the answer. */
export function ruleCoverage(answer: string, keyPoints: string[]): boolean[] {
  const said = new Set(words(answer).map(stem))
  return keyPoints.map((point) => {
    const needed = [...new Set(words(point).map(stem))]
    if (!needed.length) return false
    const hit = needed.filter((w) => said.has(w)).length
    return hit / needed.length >= 0.5
  })
}

export type AnswerRating = "strong" | "good_start" | "needs_work"

export function rateAnswer(covered: boolean[]): AnswerRating {
  const n = covered.filter(Boolean).length
  const share = covered.length ? n / covered.length : 0
  if (share >= 0.75) return "strong"
  if (share >= 0.4) return "good_start"
  return "needs_work"
}

export const RATING_LABEL: Record<AnswerRating, string> = {
  strong: "Strong answer",
  good_start: "Good start",
  needs_work: "Needs more detail",
}
