import "server-only"

import { getProject, type CatalogProject } from "@/content/projects"
import { db } from "@/lib/db"
import type { DayReview, ProgramDayRow, ProgramRow } from "@/lib/data/records"
import { DEFAULT_TIMEZONE, getProfile } from "@/lib/data/profiles"
import { computeStreak, currentDay, TOTAL_DAYS } from "./schedule"

export async function getActiveProgram(userId: string): Promise<ProgramRow | null> {
  const rows = await db().select<ProgramRow>("programs", { user_id: userId }, { order: { column: "created_at", ascending: false }, limit: 1 })
  return rows[0] ?? null
}

export async function getProgramDays(programId: string): Promise<ProgramDayRow[]> {
  return db().select<ProgramDayRow>("program_days", { program_id: programId }, { order: { column: "day_number", ascending: true } })
}

export type ProgramSummary = {
  program: ProgramRow
  project: CatalogProject
  days: ProgramDayRow[]
  daysDone: number
  streak: number
  currentDay: number
  timezone: string
}

export async function getProgramSummary(userId: string): Promise<ProgramSummary | null> {
  const program = await getActiveProgram(userId)
  if (!program) return null
  const project = getProject(program.project_key)
  if (!project) return null
  const days = await getProgramDays(program.id)
  const done = days.filter((d) => d.completed_at)
  const started = new Date(program.started_at)
  return {
    program,
    project,
    days,
    daysDone: done.length,
    streak: computeStreak(done.map((d) => new Date(d.completed_at!)), program.timezone),
    currentDay: currentDay(started, program.timezone),
    timezone: program.timezone,
  }
}

export async function startProgram(
  userId: string,
  projectKey: string,
  repo: { owner: string; name: string; url: string; scaffoldSha: string } | null,
  demo: boolean
) {
  const profile = await getProfile(userId)
  return db().insert<ProgramRow>("programs", {
    user_id: userId,
    project_key: projectKey,
    repo_owner: repo?.owner ?? null,
    repo_name: repo?.name ?? null,
    repo_url: repo?.url ?? null,
    scaffold_sha: repo?.scaffoldSha ?? null,
    started_at: new Date().toISOString(),
    timezone: profile?.timezone ?? DEFAULT_TIMEZONE,
    status: "active",
    completed_at: null,
    demo,
  })
}

export async function saveDayProgress(
  program: ProgramRow,
  day: number,
  patch: Partial<Pick<ProgramDayRow, "checklist" | "hints_revealed">>
) {
  return db().upsert<ProgramDayRow>(
    "program_days",
    { program_id: program.id, user_id: program.user_id, day_number: day, ...patch },
    ["program_id", "day_number"]
  )
}

export async function completeDay(
  program: ProgramRow,
  day: number,
  result: { shas: string[]; review: DayReview | null; demo: boolean }
) {
  const row = await db().upsert<ProgramDayRow>(
    "program_days",
    {
      program_id: program.id,
      user_id: program.user_id,
      day_number: day,
      completed_at: new Date().toISOString(),
      verified_shas: result.shas,
      review: result.review,
      demo_verified: result.demo,
    },
    ["program_id", "day_number"]
  )
  const days = await getProgramDays(program.id)
  if (days.filter((d) => d.completed_at).length >= TOTAL_DAYS && program.status !== "completed") {
    await db().update<ProgramRow>("programs", { id: program.id }, { status: "completed", completed_at: new Date().toISOString() })
  }
  return row
}

/** Every sha already counted for some day, so one commit can't complete two days. */
export function usedShas(days: ProgramDayRow[]): Set<string> {
  return new Set(days.flatMap((d) => d.verified_shas ?? []))
}
