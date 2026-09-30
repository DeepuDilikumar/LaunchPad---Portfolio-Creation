import { ArrowRight, Award, ExternalLink, Flame, Megaphone, MessageSquareQuote } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { GitHubIcon } from "@/components/icons/brand"
import { ProgramIntro } from "@/components/program/program-intro"
import { ProjectPicker } from "@/components/program/project-picker"
import { StreakGrid } from "@/components/program/streak-grid"
import { buttonVariants } from "@/components/ui/button"
import { PROJECTS } from "@/content/projects"
import { requireUser } from "@/lib/auth/session"
import { getEntitlements, purchasableProducts } from "@/lib/data/entitlements"
import { getProfile } from "@/lib/data/profiles"
import { getLatestReport } from "@/lib/diagnostic/service"
import { isDemoMode, isGithubConfigured, isRazorpayConfigured } from "@/lib/env"
import { getGithubConnection } from "@/lib/github/client"
import { rankProjects } from "@/lib/program/recommend"
import { TOTAL_DAYS } from "@/lib/program/schedule"
import { getProgramSummary } from "@/lib/program/service"
import { dayCells, nextDay } from "@/lib/program/view"
import { emptyProfile } from "@/lib/profile/types"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { title: "14-Day Program", robots: { index: false } }

export default async function ProgramPage({ searchParams }: PageProps<"/program">) {
  const user = await requireUser("/program")
  const params = await searchParams
  const [ent, summary] = await Promise.all([getEntitlements(user.id), getProgramSummary(user.id)])
  const demo = isDemoMode()

  if (!ent.program) {
    const sample = PROJECTS[0].days[3]
    return (
      <ProgramIntro
        purchasable={purchasableProducts(ent)}
        demo={demo && !isRazorpayConfigured()}
        sampleDay={{ title: `Day 4: ${sample.title}`, goal: sample.goal, minutes: sample.minutes, steps: sample.steps }}
        projectTitles={PROJECTS.map((p) => p.title)}
      />
    )
  }

  if (!summary) {
    const [profile, report, github] = await Promise.all([getProfile(user.id), getLatestReport(user.id), getGithubConnection(user.id)])
    const ranked = rankProjects(profile?.data ?? emptyProfile(), report)
    return (
      <ProjectPicker
        projects={ranked.map(({ project, reasons, recommended }) => ({
          key: project.key,
          title: project.title,
          tagline: project.tagline,
          difficulty: project.difficulty,
          stack: project.stack,
          interviewTopics: project.interviewTopics,
          jdMapping: project.jdMapping,
          reasons,
          recommended,
          firstDays: project.days.slice(0, 3).map((d) => `Day ${d.day}: ${d.title}`),
        }))}
        githubLogin={github?.login ?? null}
        githubConfigured={isGithubConfigured()}
        demo={demo}
        githubStatus={typeof params.github === "string" ? params.github : null}
      />
    )
  }

  const { project, program, daysDone, streak } = summary
  const cells = dayCells(summary)
  const next = nextDay(summary)
  const nextContent = next ? project.days[next - 1] : null
  const complete = daysDone >= TOTAL_DAYS

  return (
    <div className="mx-auto max-w-3xl px-4 pt-6 sm:px-6 md:pt-10">
      <p className="text-sm font-medium text-accent-text">
        {complete ? "Project complete" : `Day ${summary.currentDay} of ${TOTAL_DAYS}`}
      </p>
      <h1 className="mt-1 text-h1 font-normal md:text-h1-lg">{project.title}</h1>
      {program.repo_url ? (
        <a href={program.repo_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-11 items-center gap-2 text-sm text-accent-text hover:underline">
          <GitHubIcon className="size-4" />
          {program.repo_url.replace("https://github.com/", "")}
          <ExternalLink className="size-3.5" aria-hidden />
        </a>
      ) : program.demo ? (
        <p className="mt-2 text-caption text-muted-foreground">Demo mode: no GitHub repo; days are marked done without checking commits.</p>
      ) : null}

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-surface p-4">
          <p className="flex items-center gap-1.5 text-caption text-muted-foreground">
            <Flame className="size-4 text-warning" aria-hidden />
            Streak
          </p>
          <p className="tabular mt-1 font-mono text-[2rem] leading-none">
            {streak}
            <span className="ml-1 font-sans text-sm text-muted-foreground">day{streak === 1 ? "" : "s"}</span>
          </p>
        </div>
        <div className="rounded-2xl bg-surface p-4">
          <p className="text-caption text-muted-foreground">Progress</p>
          <p className="tabular mt-1 font-mono text-[2rem] leading-none">
            {daysDone}
            <span className="font-sans text-sm text-muted-foreground">/{TOTAL_DAYS} days</span>
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
            <div className="h-full rounded-full bg-primary" style={{ width: `${(daysDone / TOTAL_DAYS) * 100}%` }} />
          </div>
        </div>
      </div>

      <div className="mt-5">
        <StreakGrid cells={cells} />
      </div>

      {complete ? (
        <section className="mt-6 rounded-2xl bg-success-bg p-5" aria-labelledby="done-title">
          <h2 id="done-title" className="flex items-center gap-2 text-h3 font-medium text-success">
            <Award className="size-5" aria-hidden />
            You built it. All 14 days done.
          </h2>
          <Link href="/program/certificate" className={cn(buttonVariants({ size: "lg" }), "mt-4 w-full sm:w-auto")}>
            View your certificate
          </Link>
        </section>
      ) : nextContent ? (
        <section className="mt-6 rounded-2xl border border-border bg-card p-5" aria-labelledby="today-title">
          <p className="text-caption text-muted-foreground">
            {next === summary.currentDay ? "Today" : "Catch up"} · Day {next} · ~{nextContent.minutes} min
          </p>
          <h2 id="today-title" className="mt-1 text-h3 font-medium">
            {nextContent.title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{nextContent.goal}</p>
          <Link href={`/program/day/${next}`} className={cn(buttonVariants({ size: "lg" }), "mt-4 w-full sm:w-auto")}>
            {next === summary.currentDay ? "Start today's task" : `Catch up on Day ${next}`}
            <ArrowRight aria-hidden />
          </Link>
        </section>
      ) : (
        <section className="mt-6 rounded-2xl bg-surface p-5">
          <p className="font-medium">You&apos;re all caught up.</p>
          <p className="mt-1 text-sm text-muted-foreground">The next day unlocks at midnight. Rest, or practise your interview answers.</p>
        </section>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Link href="/program/defend" className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 hover:bg-muted/50">
          <MessageSquareQuote className="mt-0.5 size-5 shrink-0 text-accent-text" aria-hidden />
          <span>
            <span className="block font-medium">Defend your project</span>
            <span className="block text-sm text-muted-foreground">Practise interview questions about what you&apos;ve built so far.</span>
          </span>
        </Link>
        <Link href="/program/announce" className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 hover:bg-muted/50">
          <Megaphone className="mt-0.5 size-5 shrink-0 text-accent-text" aria-hidden />
          <span>
            <span className="block font-medium">Announce it</span>
            <span className="block text-sm text-muted-foreground">LinkedIn post, resume bullets and cold messages from your real work.</span>
          </span>
        </Link>
      </div>
    </div>
  )
}
