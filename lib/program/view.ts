import type { DayCell } from "@/components/program/streak-grid"
import type { ProgramSummary } from "./service"
import { TOTAL_DAYS, isUnlocked, localDateKey, unlockTime } from "./schedule"

/** Grid states for the dashboard, computed on the server in the student's timezone. */
export function dayCells(summary: ProgramSummary, now = new Date()): DayCell[] {
  const started = new Date(summary.program.started_at)
  const done = new Set(summary.days.filter((d) => d.completed_at).map((d) => d.day_number))
  const today = localDateKey(now, summary.timezone)
  return Array.from({ length: TOTAL_DAYS }, (_, i) => {
    const day = i + 1
    const title = summary.project.days[i].title
    if (done.has(day)) return { day, title, state: "done" as const }
    if (!isUnlocked(day, started, summary.timezone, now)) return { day, title, state: "locked" as const }
    const unlockedToday = localDateKey(unlockTime(day, started, summary.timezone), summary.timezone) === today
    if (day === summary.currentDay || unlockedToday) return { day, title, state: "today" as const }
    return { day, title, state: day < summary.currentDay ? ("missed" as const) : ("open" as const) }
  })
}

/** The day to work on now: the earliest unfinished unlocked day. */
export function nextDay(summary: ProgramSummary): number | null {
  const done = new Set(summary.days.filter((d) => d.completed_at).map((d) => d.day_number))
  for (let d = 1; d <= summary.currentDay; d++) if (!done.has(d)) return d
  return null
}

export function formatUnlock(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-IN", { timeZone, weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(date)
}
