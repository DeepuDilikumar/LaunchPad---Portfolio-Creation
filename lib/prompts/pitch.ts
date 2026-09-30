import { z } from "zod"

import type { PitchKind } from "@/lib/data/records"
import type { PitchFacts } from "@/lib/pitch/facts"
import type { Tone } from "@/lib/pitch/templates"

export const PitchSchema = z.object({ text: z.string() })

export const PITCH_SYSTEM = `You write short career content for an Indian engineering student about a project they built themselves.
Hard rules:
- Use ONLY the facts given. Mention only completed days' work. Never invent features, users, companies, numbers or results.
- Any metric you'd want but don't have becomes a bracketed placeholder like [X% faster] or [X requests/sec] for the student to fill in.
- Plain, warm, specific English. No hype words ("thrilled", "game-changer", "revolutionary"), no emoji walls, at most 3 hashtags.
- Sound like a real person, not a template.`

const BRIEF: Record<PitchKind, string> = {
  linkedin: "A LinkedIn post (120-200 words) announcing the project, with the repo link if there is one.",
  bullets: "Exactly three resume bullets for the Projects section, each starting with '• ' and a strong past-tense verb, under 25 words each.",
  dm: "A cold LinkedIn message (under 90 words) to an engineer or recruiter. Start with 'Hi [Name],' and include one [specific detail about their team] placeholder.",
  profile: "A LinkedIn headline (under 120 characters) on a line after 'Headline:', then an About section (80-140 words) after 'About:'.",
}

const TONE: Record<Tone, string> = {
  humble: "Tone: humble and curious, open to feedback.",
  confident: "Tone: confident and direct, without bragging.",
  story: "Tone: a short personal story arc: problem, what I did, what I learned.",
}

export function pitchPrompt(kind: PitchKind, tone: Tone, f: PitchFacts) {
  return `${BRIEF[kind]}
${kind === "linkedin" ? TONE[tone] : ""}

<facts>
${JSON.stringify(f, null, 2)}
</facts>`
}
