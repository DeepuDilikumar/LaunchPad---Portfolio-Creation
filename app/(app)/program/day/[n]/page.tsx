import { ArrowLeft, Lock } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { DayView } from "@/components/program/day-view"
import { StatePanel } from "@/components/shared/state-panel"
import { buttonVariants } from "@/components/ui/button"
import { requireUser } from "@/lib/auth/session"
import { db } from "@/lib/db"
import type { MentorMessageRow } from "@/lib/data/records"
import { isLLMConfigured } from "@/lib/env"
import { TOTAL_DAYS, computeStreak, isUnlocked, unlockTime } from "@/lib/program/schedule"
import { getProgramSummary } from "@/lib/program/service"
import { formatUnlock } from "@/lib/program/view"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { title: "Today's task", robots: { index: false } }

export default async function DayPage({ params }: PageProps<"/program/day/[n]">) {
  const { n } = await params
  const dayNumber = Number(n)
  if (!Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > TOTAL_DAYS) notFound()
  const user = await requireUser(`/program/day/${dayNumber}`)
  const summary = await getProgramSummary(user.id)
  if (!summary) redirect("/program")

  const { program, project, days } = summary
  const started = new Date(program.started_at)
  if (!isUnlocked(dayNumber, started, program.timezone)) {
    return (
      <div className="px-4 py-16">
        <StatePanel
          icon={Lock}
          title={`Day ${dayNumber} unlocks ${formatUnlock(unlockTime(dayNumber, started, program.timezone), program.timezone)}`}
          action={
            <Link href="/program" className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}>
              <ArrowLeft aria-hidden />
              Back to your progress
            </Link>
          }
        >
          <p>One day at a time keeps your commit history real. Finish any open days meanwhile.</p>
        </StatePanel>
      </div>
    )
  }

  const row = days.find((d) => d.day_number === dayNumber)
  const messages = await db().select<MentorMessageRow>(
    "mentor_messages",
    { program_id: program.id, day_number: dayNumber },
    { order: { column: "created_at", ascending: true } }
  )
  const completedDates = days.filter((d) => d.completed_at).map((d) => new Date(d.completed_at!))
  const streakAfterToday = computeStreak(row?.completed_at ? completedDates : [...completedDates, new Date()], program.timezone)

  return (
    <DayView
      day={project.days[dayNumber - 1]}
      totalDays={TOTAL_DAYS}
      initialChecklist={row?.checklist ?? []}
      initialHints={row?.hints_revealed ?? 0}
      completed={row?.completed_at ? { shas: row.verified_shas ?? [], review: row.review, demo: row.demo_verified } : null}
      streakAfterToday={streakAfterToday}
      repoUrl={program.repo_url}
      demo={program.demo}
      aiEnabled={isLLMConfigured()}
      messages={messages.map((m) => ({ role: m.role, content: m.content }))}
      prevDay={dayNumber > 1 ? dayNumber - 1 : null}
      nextDayUnlocked={isUnlocked(dayNumber + 1, started, program.timezone)}
    />
  )
}
