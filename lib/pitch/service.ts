import "server-only"

import { db } from "@/lib/db"
import type { PitchDraftRow, PitchKind } from "@/lib/data/records"
import { getProfile } from "@/lib/data/profiles"
import { generateStructured } from "@/lib/llm"
import { emptyProfile } from "@/lib/profile/types"
import { PITCH_SYSTEM, PitchSchema, pitchPrompt } from "@/lib/prompts/pitch"
import type { ProgramSummary } from "@/lib/program/service"
import { buildFacts, type PitchFacts } from "./facts"
import { inventsNumbers } from "./guard"
import { rulePitch, type Tone } from "./templates"

export async function factsFor(userId: string, summary: ProgramSummary): Promise<PitchFacts> {
  const profile = await getProfile(userId)
  const done = summary.days.filter((d) => d.completed_at)
  return buildFacts({
    profile: profile?.data ?? emptyProfile(),
    project: summary.project,
    completedDayNumbers: done.map((d) => d.day_number),
    commits: new Set(done.flatMap((d) => d.verified_shas ?? [])).size,
    repoUrl: summary.program.repo_url,
  })
}

export async function getDrafts(userId: string) {
  return db().select<PitchDraftRow>("pitch_drafts", { user_id: userId })
}

export async function generatePitch(kind: PitchKind, tone: Tone, facts: PitchFacts): Promise<{ text: string; source: "ai" | "rules" }> {
  const factsJson = JSON.stringify(facts)
  const ai = await generateStructured({
    task: `pitch:${kind}`,
    system: PITCH_SYSTEM,
    prompt: pitchPrompt(kind, tone, facts),
    schema: PitchSchema,
    effort: "low",
    maxTokens: 4000,
  })
  if (ai?.text.trim() && !inventsNumbers(ai.text, factsJson + " SDE-1 10")) return { text: ai.text.trim(), source: "ai" }
  return { text: rulePitch(kind, facts, tone), source: "rules" }
}

export async function saveDraft(userId: string, programId: string, kind: PitchKind, tone: string, content: string, source: "ai" | "rules") {
  return db().upsert<PitchDraftRow>(
    "pitch_drafts",
    { user_id: userId, program_id: programId, kind, tone, content, source },
    ["user_id", "kind", "tone"]
  )
}
