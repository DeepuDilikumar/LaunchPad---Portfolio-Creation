import "server-only"

import type { ProgramBadge } from "@/lib/portfolio/types"
import { getProgramSummary } from "./service"

/** The LaunchPad-built project to show on a portfolio, if the student has one. */
export async function getProgramBadge(userId: string): Promise<ProgramBadge | null> {
  const summary = await getProgramSummary(userId)
  if (!summary) return null
  return {
    title: summary.project.title,
    repoUrl: summary.program.repo_url,
    daysDone: summary.daysDone,
    totalDays: 14,
    complete: summary.daysDone >= 14,
    stack: summary.project.stack.slice(0, 6),
  }
}
