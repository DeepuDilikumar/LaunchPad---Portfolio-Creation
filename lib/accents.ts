export const accents = {
  foundations: "#E7E7E7",
  pulse: "#3CCFB4",
  ledger: "#E7C04A",
  reel: "#EF5A4C",
  dispatch: "#F28C38",
  scribe: "#8B6CF0",
  atlas: "#3B82F6",
} as const;

export type AccentKey = keyof typeof accents;

export function accentFor(slug: string): string {
  return (accents as Record<string, string>)[slug] ?? accents.foundations;
}

export const statusColors = {
  working: "#E7A13A",
  passed: "#3CCFB4",
  failed: "#EF5A4C",
} as const;
