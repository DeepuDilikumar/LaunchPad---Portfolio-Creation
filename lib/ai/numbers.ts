/**
 * The "only numbers you measured" rule, enforced after generation: any number in the
 * output must appear in the learner's input.
 */
export function numbersIn(text: string): string[] {
  return (text.match(/\d+(?:[.,]\d+)*/g) ?? []).map(normalizeNumber);
}

export function normalizeNumber(n: string): string {
  // "3,000" and "3000" are the same number; "0.91" stays as is.
  return n.replace(/,(?=\d{3}\b)/g, "").replace(/^0+(?=\d)/, "");
}

export function allowedNumbers(inputs: string[]): Set<string> {
  return new Set(inputs.flatMap(numbersIn));
}

export function onlyKnownNumbers(text: string, allowed: Set<string>): boolean {
  return numbersIn(text).every((n) => allowed.has(n));
}

/** Drop any bullet that contains a number the learner didn't enter. */
export function filterBullets(bullets: string[], allowed: Set<string>): string[] {
  return bullets.filter((b) => onlyKnownNumbers(b, allowed));
}

/** In the case study, remove sentences that contain unknown numbers. */
export function scrubCaseStudy(md: string, allowed: Set<string>): string {
  return md
    .split("\n")
    .map((line) => {
      if (line.startsWith("## ") || onlyKnownNumbers(line, allowed)) return line;
      const kept = line.split(/(?<=[.!?])\s+/).filter((s) => onlyKnownNumbers(s, allowed));
      return kept.join(" ");
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
