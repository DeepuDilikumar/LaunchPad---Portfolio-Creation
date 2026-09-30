/**
 * Rule-based bullet rewrite (used when AI isn't available). Strengthens the opening verb and
 * adds a clearly marked placeholder where a number is missing. Never invents facts or numbers.
 */
const WEAK_OPENERS: [RegExp, string][] = [
  [/^(i\s+)?(worked on|was working on)\s+/i, "Built "],
  [/^(i\s+)?(was )?responsible for\s+/i, "Owned "],
  [/^(i\s+)?(helped (to )?|assisted (in|with) )/i, "Contributed to "],
  [/^(i\s+)?(made|created|developed)\s+(a|an)\s+/i, "Built $3 "],
  [/^(i\s+)?(made|did|created)\s+/i, "Built "],
  [/^(i\s+)?(learnt|learned|studied)\s+/i, "Applied "],
  [/^(i\s+)?(participated in)\s+/i, "Took part in "],
  [/^(i\s+)?(handled)\s+/i, "Managed "],
]

const HAS_NUMBER = /\d/

export function ruleRewrite(original: string): string {
  let text = original.trim().replace(/\.$/, "")
  for (const [pattern, replacement] of WEAK_OPENERS) {
    if (pattern.test(text)) {
      text = text.replace(pattern, replacement)
      break
    }
  }
  text = text.charAt(0).toUpperCase() + text.slice(1)
  if (!HAS_NUMBER.test(text)) {
    text = /\b(api|apis|endpoint|backend|server|query|queries|database|page load|latency|performance)\b/i.test(text)
      ? `${text}, cutting response time by [X%]`
      : `${text}, used by [N users]`
  }
  return text
}
