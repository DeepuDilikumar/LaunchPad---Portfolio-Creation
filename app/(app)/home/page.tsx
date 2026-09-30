import { ArrowRight, Check, Clock } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { requireUser } from "@/lib/auth/session"
import { getEntitlements } from "@/lib/data/entitlements"
import { getPortfolioForUser } from "@/lib/data/portfolios"
import { getProfile } from "@/lib/data/profiles"
import { getLatestReport } from "@/lib/diagnostic/service"
import { nextStep } from "@/lib/home/next-step"
import { localDateKey, TOTAL_DAYS } from "@/lib/program/schedule"
import { getProgramSummary } from "@/lib/program/service"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { title: "Home", robots: { index: false } }

function greeting(timeZone: string) {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hourCycle: "h23", timeZone }).format(new Date()))
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

export default async function HomePage() {
  const user = await requireUser("/home")
  const [profile, portfolio, report, ent, summary] = await Promise.all([
    getProfile(user.id),
    getPortfolioForUser(user.id),
    getLatestReport(user.id),
    getEntitlements(user.id),
    getProgramSummary(user.id),
  ])
  const tz = profile?.timezone ?? "Asia/Kolkata"
  const today = localDateKey(new Date(), tz)
  const todayDone = Boolean(summary?.days.some((d) => d.completed_at && localDateKey(new Date(d.completed_at), tz) === today))

  const state = {
    portfolioLive: Boolean(portfolio?.is_published),
    hasReport: Boolean(report),
    overall: report?.overall ?? null,
    reportUnlocked: ent.report,
    programOwned: ent.program,
    programStarted: Boolean(summary),
    daysDone: summary?.daysDone ?? 0,
    currentDay: summary?.currentDay ?? 1,
    todayDone,
    totalDays: TOTAL_DAYS,
  }
  const step = nextStep(state)
  const first = (profile?.data.fullName || user.name || "").split(" ")[0]

  const journey = [
    {
      label: "Portfolio",
      status: state.portfolioLive ? "Live" : "Not published yet",
      done: state.portfolioLive,
      href: state.portfolioLive ? "/portfolio" : "/start",
    },
    {
      label: "Profile report",
      status: report ? `Score ${report.overall} · target ${report.target}` : "Not checked yet",
      done: Boolean(report),
      href: "/report",
    },
    {
      label: "14-day project",
      status: summary ? `${summary.daysDone}/${TOTAL_DAYS} days · ${summary.project.title}` : ent.program ? "Ready to start" : "Not started",
      done: Boolean(summary && summary.daysDone >= TOTAL_DAYS),
      href: "/program",
    },
  ]

  return (
    <div className="mx-auto max-w-2xl px-4 pt-6 sm:px-6 md:pt-10">
      <p className="text-muted-foreground">{greeting(tz)}{first ? `, ${first}` : ""}</p>
      <h1 className="mt-1 text-h1 font-normal">Here&apos;s your next step</h1>

      <section className="mt-6 animate-rise rounded-3xl bg-tonal p-5 sm:p-6" aria-labelledby="next-title">
        {step.time ? (
          <p className="inline-flex items-center gap-1.5 text-caption text-tonal-foreground">
            <Clock className="size-3.5" aria-hidden />
            {step.time}
          </p>
        ) : null}
        <h2 id="next-title" className="mt-1 text-h2 font-medium text-tonal-foreground">
          {step.title}
        </h2>
        <p className="mt-1 text-tonal-foreground/90">{step.body}</p>
        <Link href={step.href} className={cn(buttonVariants({ size: "lg" }), "mt-5 w-full sm:w-auto")}>
          {step.cta}
          <ArrowRight aria-hidden />
        </Link>
      </section>

      <section className="mt-8" aria-labelledby="journey-title">
        <h2 id="journey-title" className="text-sm font-medium text-muted-foreground">
          Your journey
        </h2>
        <ol className="mt-3 overflow-hidden rounded-2xl border border-border bg-card">
          {journey.map((j, i) => (
            <li key={j.label} className={cn(i > 0 && "border-t border-border")}>
              <Link href={j.href} className="flex min-h-16 items-center gap-3 px-4 py-3 hover:bg-muted/50">
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-medium",
                    j.done ? "bg-success-bg text-success" : "bg-muted text-muted-foreground"
                  )}
                >
                  {j.done ? <Check className="size-4" aria-label="Done" /> : i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{j.label}</span>
                  <span className="block truncate text-sm text-muted-foreground">{j.status}</span>
                </span>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
