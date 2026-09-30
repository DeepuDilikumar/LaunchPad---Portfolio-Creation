import { PLACEHOLDER } from "@/lib/resume/document"

/**
 * True if the text states a number that isn't in the facts (outside [placeholders]).
 * Used to reject LLM output that invents metrics; the rule-based text is used instead.
 */
export function inventsNumbers(text: string, factsJson: string): boolean {
  const withoutPlaceholders = text.replace(PLACEHOLDER, " ").replace(/https?:\/\/\S+/g, " ")
  const numbers = withoutPlaceholders.match(/\d+(?:[.,]\d+)?%?/g) ?? []
  const allowed = new Set(factsJson.match(/\d+(?:[.,]\d+)?/g) ?? [])
  // Small counting words like "1" or "2" in "SDE-1" are in the facts via the role text; allow years too.
  return numbers.some((n) => {
    const bare = n.replace(/%$/, "")
    if (allowed.has(bare)) return false
    if (/^(19|20)\d\d$/.test(bare)) return false
    return true
  })
}
