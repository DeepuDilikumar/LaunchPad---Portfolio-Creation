import "server-only"

import { createHash } from "node:crypto"

import { db } from "@/lib/db"
import type { Entitlements } from "@/lib/data/entitlements"
import { getProfile } from "@/lib/data/profiles"
import { getLatestResume } from "@/lib/data/resumes"
import { getGithubSignal } from "@/lib/github/signal"
import { generateStructured, isLLMConfigured } from "@/lib/llm"
import {
  AiJudgementSchema,
  DIAGNOSTIC_SYSTEM,
  FREE_PILLAR,
  RUBRIC_VERSION,
  diagnosticPrompt,
} from "@/lib/prompts/diagnostic"
import { aiChecks, buildReport, type AiVerdicts } from "./score"
import type { DiagnosticInput, Report, VisibleReport } from "./types"

type DiagnosticRow = {
  id: string
  user_id: string
  input_hash: string
  rubric_version: string
  result: Report
  overall_score: number
  source: "ai" | "rules"
  created_at: string
}

export type Stage = "reading" | "projects" | "github" | "scoring"

export class DiagnosticError extends Error {
  constructor(public code: "no_profile", message: string) {
    super(message)
  }
}

export async function getLatestReport(userId: string): Promise<Report | null> {
  const rows = await db().select<DiagnosticRow>(
    "diagnostics",
    { user_id: userId },
    { order: { column: "created_at", ascending: false }, limit: 1 }
  )
  return rows[0]?.result ?? null
}

/**
 * Runs (or re-uses) the diagnostic. The same resume + profile + GitHub state gives the same
 * cached report, so reruns never drift.
 */
export async function runDiagnostic(userId: string, onStage: (stage: Stage) => void = () => {}): Promise<Report> {
  onStage("reading")
  const profile = await getProfile(userId)
  const resume = await getLatestResume(userId)
  if (!profile || (!resume && profile.data.projects.length === 0)) {
    throw new DiagnosticError("no_profile", "Upload your resume or add your projects first.")
  }

  const github = await getGithubSignal(userId).catch(() => null)
  if (github) onStage("github")

  const input: DiagnosticInput = {
    profile: profile.data,
    profileJson: JSON.stringify(profile.data),
    resumeText: resume?.extracted_text ?? "",
    layout: resume?.layout ?? "unknown",
    hasTables: resume?.has_tables ?? false,
    github,
  }
  const mode = isLLMConfigured() ? "ai" : "rules"
  const inputHash = createHash("sha256")
    .update([RUBRIC_VERSION, mode, input.profileJson, resume?.text_hash ?? "", input.layout, String(input.hasTables), JSON.stringify(github)].join("|"))
    .digest("hex")

  const cached = await db().selectOne<DiagnosticRow>("diagnostics", {
    user_id: userId,
    input_hash: inputHash,
    rubric_version: RUBRIC_VERSION,
  })
  onStage("projects")
  if (cached) {
    onStage("scoring")
    // Bump recency so "latest" reflects this run.
    await db().update("diagnostics", { id: cached.id }, { created_at: new Date().toISOString() })
    return cached.result
  }

  let verdicts: AiVerdicts | null = null
  if (mode === "ai") {
    const checks = aiChecks()
    const judged = await generateStructured({
      task: "diagnostic",
      system: DIAGNOSTIC_SYSTEM,
      prompt: diagnosticPrompt({ resumeText: input.resumeText.slice(0, 30_000), profileJson: input.profileJson, checks }),
      schema: AiJudgementSchema,
      effort: "medium",
    })
    if (judged) {
      verdicts = {}
      for (const c of judged.checks) {
        if (checks.some((k) => k.id === c.id)) verdicts[c.id] = { met: c.met, evidence: c.evidence }
      }
    }
  }

  onStage("scoring")
  const report = buildReport(input, verdicts)
  await db().upsert<DiagnosticRow>(
    "diagnostics",
    {
      user_id: userId,
      input_hash: inputHash,
      rubric_version: RUBRIC_VERSION,
      result: report,
      overall_score: report.overall,
      source: report.source,
      created_at: new Date().toISOString(),
    },
    ["user_id", "input_hash", "rubric_version"]
  )
  return report
}

/** Free users see the overall score + one pillar; locked pillars never leave the server. */
export function visibleReport(report: Report, ent: Entitlements): VisibleReport {
  if (ent.report) return { ...report, unlocked: true }
  return {
    ...report,
    unlocked: false,
    pillars: report.pillars.map((p) =>
      p.key === FREE_PILLAR ? p : { key: p.key, title: p.title, short: p.short, status: p.status, locked: true as const }
    ),
  }
}
