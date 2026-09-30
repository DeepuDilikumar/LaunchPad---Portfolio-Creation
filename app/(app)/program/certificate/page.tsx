import { ArrowLeft, Award, ExternalLink, Rocket } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { GitHubIcon } from "@/components/icons/brand"
import { PrintButton } from "@/components/program/print-button"
import { StatePanel } from "@/components/shared/state-panel"
import { buttonVariants } from "@/components/ui/button"
import { requireUser } from "@/lib/auth/session"
import { getProfile } from "@/lib/data/profiles"
import { TOTAL_DAYS } from "@/lib/program/schedule"
import { getProgramSummary } from "@/lib/program/service"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { title: "Completion record", robots: { index: false } }

function formatDate(iso: string, timeZone: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone }).format(new Date(iso))
}

export default async function CertificatePage() {
  const user = await requireUser("/program/certificate")
  const [summary, profile] = await Promise.all([getProgramSummary(user.id), getProfile(user.id)])
  if (!summary) redirect("/program")

  const { project, program, days, daysDone, timezone } = summary
  if (daysDone < TOTAL_DAYS) {
    return (
      <div className="px-4 py-16">
        <StatePanel
          icon={Rocket}
          title={`${TOTAL_DAYS - daysDone} day${TOTAL_DAYS - daysDone === 1 ? "" : "s"} to go`}
          action={
            <Link href="/program" className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}>
              Back to your progress
            </Link>
          }
        >
          <p>Your completion record appears here once all {TOTAL_DAYS} days are verified.</p>
        </StatePanel>
      </div>
    )
  }

  const name = profile?.data.fullName || user.name || "LaunchPad student"
  const completed = days.map((d) => d.completed_at).filter(Boolean).sort() as string[]
  const commits = new Set(days.flatMap((d) => d.verified_shas ?? [])).size

  return (
    <div className="mx-auto max-w-3xl px-4 pt-6 sm:px-6 md:pt-10 print:p-0">
      <Link href="/program" className="inline-flex min-h-11 items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground print:hidden">
        <ArrowLeft className="size-4" aria-hidden />
        Program
      </Link>

      <article className="mt-2 rounded-3xl border border-border bg-card p-6 shadow-e1 sm:p-10 print:border-0 print:shadow-none">
        <span className="flex size-12 items-center justify-center rounded-xl bg-tonal text-tonal-foreground">
          <Award className="size-6" aria-hidden />
        </span>
        <p className="mt-6 text-sm text-muted-foreground">Completion record</p>
        <h1 className="mt-1 text-h1 font-normal md:text-h1-lg">{name}</h1>
        <p className="mt-3 max-w-prose text-muted-foreground">
          built <span className="font-medium text-foreground">{project.title}</span> over {TOTAL_DAYS} days with LaunchPad, one
          verified day at a time.
        </p>

        <dl className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-caption text-muted-foreground">Started</dt>
            <dd className="mt-0.5 font-medium">{formatDate(program.started_at, timezone)}</dd>
          </div>
          <div>
            <dt className="text-caption text-muted-foreground">Finished</dt>
            <dd className="mt-0.5 font-medium">{formatDate(completed.at(-1) ?? program.started_at, timezone)}</dd>
          </div>
          <div>
            <dt className="text-caption text-muted-foreground">{program.demo ? "Days completed" : "Commits verified"}</dt>
            <dd className="tabular mt-0.5 font-mono font-medium">{program.demo ? daysDone : commits}</dd>
          </div>
        </dl>

        <div className="mt-8">
          <p className="text-caption text-muted-foreground">Stack</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {project.stack.map((s) => (
              <li key={s} className="rounded-full bg-muted px-3 py-1 text-sm">
                {s}
              </li>
            ))}
          </ul>
        </div>

        {program.repo_url ? (
          <a
            href={program.repo_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm text-accent-text hover:underline"
          >
            <GitHubIcon className="size-4" />
            {program.repo_url.replace("https://github.com/", "")}
            <ExternalLink className="size-3.5" aria-hidden />
          </a>
        ) : null}

        <p className="mt-8 border-t border-border pt-4 text-caption text-muted-foreground">
          {program.demo
            ? "Demo record: days were marked done without checking GitHub. Not a verified record."
            : "Every day was verified against the student's own commits on GitHub. LaunchPad only made the first scaffold commit."}
        </p>
      </article>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row print:hidden">
        <Link href="/program/announce" className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}>
          Announce it on LinkedIn
        </Link>
        <PrintButton />
      </div>
    </div>
  )
}
