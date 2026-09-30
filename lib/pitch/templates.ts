import type { PitchKind } from "@/lib/data/records"
import type { PitchFacts } from "./facts"

export const PITCH_KINDS: { kind: PitchKind; label: string; hint: string }[] = [
  { kind: "linkedin", label: "LinkedIn post", hint: "Share what you built. Posts with a repo link get recruiters clicking." },
  { kind: "bullets", label: "Resume bullets", hint: "Three bullets for the Projects section. Replace [placeholders] with your real numbers." },
  { kind: "dm", label: "Cold message", hint: "A short note to an engineer or recruiter at a company you want." },
  { kind: "profile", label: "Headline & About", hint: "For the top of your LinkedIn profile." },
]

export const TONES = [
  { key: "humble", label: "Humble" },
  { key: "confident", label: "Confident" },
  { key: "story", label: "Story" },
] as const
export type Tone = (typeof TONES)[number]["key"]

function highlights(f: PitchFacts, n: number) {
  // Later days usually hold the most interesting engineering; show the latest n.
  return f.completedDays.slice(-n).map((d) => d.goal.replace(/\.$/, ""))
}

function progressLine(f: PitchFacts) {
  const n = f.completedDays.length
  return f.complete ? `over ${f.totalDays} days` : `in ${n} day${n === 1 ? "" : "s"} so far (of a ${f.totalDays}-day build)`
}

function stackLine(f: PitchFacts) {
  return f.project.stack.slice(0, 5).join(", ")
}

export function ruleLinkedIn(f: PitchFacts, tone: Tone): string {
  const points = highlights(f, 3).map((h) => `→ ${h}`).join("\n")
  const repo = f.repoUrl ? `\n\nCode: ${f.repoUrl}` : ""
  const commits = f.commits ? ` ${f.commits} commits, one day at a time.` : ""
  if (tone === "confident") {
    return `I built ${f.project.title} ${progressLine(f)}.${commits}

${f.project.tagline}

What it does:
${points}

Stack: ${stackLine(f)}.

I'm looking for ${f.role} SDE-1 roles and happy to walk through any design decision in it.${repo}

#softwareengineering #${f.role.toLowerCase().replace(/[^a-z]/g, "")} #buildinpublic`
  }
  if (tone === "story") {
    return `A few weeks ago, my projects looked like everyone else's: tutorial clones.

So I decided to build something real: ${f.project.title}. ${f.project.tagline}

${progressLine(f).charAt(0).toUpperCase() + progressLine(f).slice(1)}, I:
${points}

The hardest part was [one thing that was hard for you], and fixing it taught me [what you learned].${repo}

If you're hiring ${f.role} engineers, I'd love to chat.`
  }
  return `Sharing something I've been working on: ${f.project.title}.

${f.project.tagline} I built it ${progressLine(f)} with ${stackLine(f)}.

A few things I got to learn by doing:
${points}

There's a lot I'd still improve, and I'd love feedback from engineers who've built similar systems.${repo}`
}

export function ruleBullets(f: PitchFacts): string {
  const h = highlights(f, 3)
  const first = h[0] ?? f.project.tagline
  return [
    `Built ${f.project.title} using ${stackLine(f)}; ${first.charAt(0).toLowerCase()}${first.slice(1)}.`,
    h[1] ? `Implemented ${h[1].charAt(0).toLowerCase()}${h[1].slice(1)}, handling [X requests/sec or Y records] in tests.` : `Designed the core data model and API, covering [X endpoints].`,
    h[2]
      ? `${h[2]}, improving [metric, e.g. p95 latency] by [X%].`
      : `Wrote [X] automated tests and documented design trade-offs in the README.`,
  ]
    .map((b) => `• ${b}`)
    .join("\n")
}

export function ruleDm(f: PitchFacts): string {
  const h = highlights(f, 1)[0]
  const repo = f.repoUrl ? ` Code is here: ${f.repoUrl}` : ""
  return `Hi [Name], I'm ${f.name}${f.college ? `, a student at ${f.college}` : ""}. I've been building ${f.project.title} (${stackLine(f)}), most recently: ${h ? h.charAt(0).toLowerCase() + h.slice(1) : f.project.tagline.toLowerCase()}.${repo}

I noticed [something specific about their team or product]. Would you be open to a 10-minute chat about how your team approaches this, or pointing me to the right person for ${f.role} SDE-1 roles? Thank you!`
}

export function ruleProfile(f: PitchFacts): string {
  return `Headline:
${f.role} engineer · Built ${f.project.title} (${f.project.stack.slice(0, 3).join(", ")}) · Open to SDE-1 roles

About:
I like building backend systems that hold up in the real world. Recently I built ${f.project.title}: ${f.project.tagline.charAt(0).toLowerCase()}${f.project.tagline.slice(1)} ${
    f.completedDays.length ? `Along the way I ${highlights(f, 2).map((x) => x.charAt(0).toLowerCase() + x.slice(1)).join(", and ")}.` : ""
  }

I'm looking for ${f.role} roles at product companies. Happy to talk through any decision in my projects.${f.repoUrl ? `\n\nGitHub: ${f.repoUrl}` : ""}`
}

export function rulePitch(kind: PitchKind, f: PitchFacts, tone: Tone): string {
  switch (kind) {
    case "linkedin":
      return ruleLinkedIn(f, tone)
    case "bullets":
      return ruleBullets(f)
    case "dm":
      return ruleDm(f)
    case "profile":
      return ruleProfile(f)
  }
}
