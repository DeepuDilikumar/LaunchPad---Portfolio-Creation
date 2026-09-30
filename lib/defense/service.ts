import "server-only"

import type { DefenseQuestion } from "@/content/projects"
import { db } from "@/lib/db"
import type { DefenseAnswer, DefenseSessionRow } from "@/lib/data/records"
import { generateStructured } from "@/lib/llm"
import { DEFENSE_SYSTEM, DefenseJudgementSchema, defensePrompt } from "@/lib/prompts/defense"
import type { ProgramSummary } from "@/lib/program/service"
import { rateAnswer, ruleCoverage } from "./score"

/** Questions about work the student has actually completed. Never about days they haven't done. */
export function availableQuestions(summary: ProgramSummary): DefenseQuestion[] {
  const done = new Set(summary.days.filter((d) => d.completed_at).map((d) => d.day_number))
  return summary.project.defense.filter((q) => done.has(q.day))
}

export async function getDefenseSession(programId: string) {
  const rows = await db().select<DefenseSessionRow>("defense_sessions", { program_id: programId }, { order: { column: "created_at", ascending: false }, limit: 1 })
  return rows[0] ?? null
}

function ruleTip(q: DefenseQuestion, covered: boolean[]) {
  const missing = q.keyPoints.filter((_, i) => !covered[i])
  if (!missing.length) return "You covered the key points. Practise saying it out loud in under two minutes."
  return `Add a line about: ${missing[0].charAt(0).toLowerCase()}${missing[0].slice(1)}.`
}

export async function judgeAnswer(summary: ProgramSummary, q: DefenseQuestion, answer: string): Promise<DefenseAnswer> {
  const completedDays = summary.days
    .filter((d) => d.completed_at)
    .map((d) => `Day ${d.day_number}: ${summary.project.days[d.day_number - 1].title}`)
  const ai = await generateStructured({
    task: "defense",
    system: DEFENSE_SYSTEM,
    prompt: defensePrompt(summary.project, q, completedDays, answer),
    schema: DefenseJudgementSchema,
    effort: "low",
    maxTokens: 4000,
  })
  if (ai && ai.covered.length === q.keyPoints.length) {
    return { answer, covered: ai.covered, tip: ai.tip, followUp: ai.followUp || null, source: "ai", at: new Date().toISOString() }
  }
  const covered = ruleCoverage(answer, q.keyPoints)
  return { answer, covered, tip: ruleTip(q, covered), followUp: null, source: "rules", at: new Date().toISOString() }
}

export async function saveAnswer(summary: ProgramSummary, qid: string, result: DefenseAnswer) {
  const existing = await getDefenseSession(summary.program.id)
  if (existing) {
    const [row] = await db().update<DefenseSessionRow>(
      "defense_sessions",
      { id: existing.id },
      { answers: { ...existing.answers, [qid]: result }, questions: [...new Set([...existing.questions, qid])], source: result.source }
    )
    return row
  }
  return db().insert<DefenseSessionRow>("defense_sessions", {
    program_id: summary.program.id,
    user_id: summary.program.user_id,
    questions: [qid],
    answers: { [qid]: result },
    source: result.source,
  })
}

export { rateAnswer }
