"use client"

import { ArrowRight, Check, Download, FileText, Gauge, Loader2, RefreshCw, Sparkles } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

import { CheckoutSheet } from "@/components/checkout/checkout-sheet"
import { GitHubIcon } from "@/components/icons/brand"
import { Button, buttonVariants } from "@/components/ui/button"
import { formatPrice, getPlan, type ProductKey } from "@/config/pricing"
import type { LockedPillar, PillarResult, VisibleReport } from "@/lib/diagnostic/types"
import { RUBRIC, RUBRIC_TARGET } from "@/lib/prompts/diagnostic"
import { cn } from "@/lib/utils"
import { LockedPillarCard, PillarCard, ScoreBar } from "./report-parts"

type Stage = "reading" | "projects" | "github" | "scoring"
const STAGE_LABELS: { key: Stage; label: string }[] = [
  { key: "reading", label: "Reading your resume" },
  { key: "github", label: "Looking at your GitHub activity" },
  { key: "projects", label: "Checking your projects against what SDE-1 job descriptions ask for" },
  { key: "scoring", label: "Scoring against the LaunchPad Rubric" },
]

function isLocked(p: PillarResult | LockedPillar): p is LockedPillar {
  return "locked" in p
}

function useCountUp(target: number, run: boolean) {
  const [value, setValue] = useState(run ? 0 : target)
  useEffect(() => {
    const start = performance.now()
    let frame = 0
    if (!run || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      frame = requestAnimationFrame(() => setValue(target))
      return () => cancelAnimationFrame(frame)
    }
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 380)
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3))))
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, run])
  return value
}

export function ReportClient({
  initialReport,
  hasProfile,
  demo,
  githubConnected,
  githubAvailable,
  purchasable,
}: {
  initialReport: VisibleReport | null
  hasProfile: boolean
  demo: boolean
  githubConnected: boolean
  githubAvailable: boolean
  purchasable: ProductKey[]
}) {
  const [report, setReport] = useState(initialReport)
  const [running, setRunning] = useState(false)
  const [stages, setStages] = useState<Stage[]>([])
  const [error, setError] = useState<string | null>(null)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [justUnlocked, setJustUnlocked] = useState(false)
  const [animateScore, setAnimateScore] = useState(false)

  async function run() {
    setRunning(true)
    setError(null)
    setStages([])
    try {
      const response = await fetch("/api/diagnostic", { method: "POST" })
      if (!response.ok || !response.body) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error?.message ?? "Scoring didn't start. Please try again.")
      }
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""
      for (;;) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() ?? ""
        for (const line of lines) {
          if (!line.trim()) continue
          const msg = JSON.parse(line) as { type: string; stage?: Stage; report?: VisibleReport; message?: string }
          if (msg.type === "stage" && msg.stage) setStages((s) => (s.includes(msg.stage!) ? s : [...s, msg.stage!]))
          if (msg.type === "result" && msg.report) {
            setAnimateScore(true)
            setReport(msg.report)
          }
          if (msg.type === "error") throw new Error(msg.message)
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Scoring didn't finish. Please try again.")
    } finally {
      setRunning(false)
    }
  }

  async function onPaid() {
    setCheckoutOpen(false)
    const r = await fetch("/api/diagnostic", { cache: "no-store" })
    const data = (await r.json()) as { report: VisibleReport | null }
    if (data.report) {
      setReport(data.report)
      setJustUnlocked(true)
    }
  }

  if (!hasProfile) {
    return (
      <Intro>
        <div className="rounded-2xl bg-surface p-6">
          <p className="text-h3 font-medium">First, add your resume</p>
          <p className="mt-1 text-muted-foreground">We score what&apos;s on your resume and portfolio. It takes about 2 minutes.</p>
          <Link href="/start" className={cn(buttonVariants({ size: "lg" }), "mt-5 w-full sm:w-auto")}>
            Upload resume
            <ArrowRight aria-hidden />
          </Link>
        </div>
      </Intro>
    )
  }

  if (running) {
    const visible = STAGE_LABELS.filter((s) => s.key !== "github" || stages.includes("github"))
    return (
      <Intro>
        <div role="status" aria-live="polite" className="rounded-2xl bg-surface p-6">
          <ul className="flex flex-col gap-4">
            {visible.map((s) => {
              const idx = stages.indexOf(s.key)
              const done = idx !== -1 && idx < stages.length - 1
              const active = idx === stages.length - 1
              return (
                <li key={s.key} className="flex items-center gap-3">
                  <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full", done ? "bg-primary text-primary-foreground" : "bg-tonal text-tonal-foreground")}>
                    {done ? <Check className="size-4" aria-hidden /> : active ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                  </span>
                  <span className={cn(done || active ? "text-foreground" : "text-muted-foreground")}>{s.label}</span>
                </li>
              )
            })}
          </ul>
        </div>
      </Intro>
    )
  }

  if (!report) {
    return (
      <Intro>
        <div className="rounded-2xl border border-border bg-card p-5 md:p-6">
          <p className="text-h3 font-medium">What we check</p>
          <ul className="mt-4 flex flex-col gap-3">
            {RUBRIC.map((p) => (
              <li key={p.key} className="flex gap-3 text-sm">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-tonal text-tonal-foreground">
                  <Check className="size-3.5" aria-hidden />
                </span>
                <span>
                  <span className="font-medium">{p.title}</span>
                  <span className="block text-muted-foreground">{p.short}</span>
                </span>
              </li>
            ))}
          </ul>
          <Button size="lg" className="mt-6 w-full sm:w-auto" onClick={() => void run()}>
            <Gauge aria-hidden />
            Check my profile · free
          </Button>
          <p className="mt-2 text-caption text-muted-foreground">Takes about a minute. Your overall score and one pillar are free.</p>
          {error ? <p role="alert" className="mt-4 rounded-2xl bg-danger-bg p-4 text-sm text-danger">{error}</p> : null}
        </div>
      </Intro>
    )
  }

  const pillars = report.pillars
  const freePillar = pillars.find((p) => !isLocked(p)) as PillarResult | undefined
  const needWork = pillars.filter((p) => p.status === "critical" || p.status === "needs_work").length
  const reportPrice = formatPrice(getPlan("report").amountPaise)

  return (
    <div className="mx-auto max-w-3xl px-4 pt-6 sm:px-6 md:pt-10">
      <h1 className="text-h1 font-normal md:text-h1-lg">Your profile score</h1>
      <OverallCard report={report} needWork={needWork} animate={animateScore} />

      {report.unlocked ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <Link href="/report/resume" className={cn(buttonVariants({ size: "lg" }), "sm:col-span-2")}>
            <FileText aria-hidden />
            Fix my resume
          </Link>
          <a href="/api/report/pdf" className={buttonVariants({ variant: "outline", size: "lg" })}>
            <Download aria-hidden />
            Download PDF
          </a>
        </div>
      ) : null}

      {justUnlocked ? (
        <p className="animate-rise mt-4 flex items-center gap-2 rounded-2xl bg-success-bg p-4 text-sm text-success" role="status">
          <Sparkles className="size-4" aria-hidden />
          Unlocked. Here&apos;s your full report.
        </p>
      ) : null}

      <div className="mt-6 flex flex-col gap-4">
        {freePillar && !report.unlocked ? <PillarCard pillar={freePillar} /> : null}

        {!report.unlocked ? (
          <section className="rounded-2xl bg-tonal p-5 text-tonal-foreground md:p-6" aria-labelledby="unlock-title">
            <h2 id="unlock-title" className="text-h2 font-normal">
              See all 5 pillars and fix them
            </h2>
            <ul className="mt-3 flex flex-col gap-1.5 text-sm">
              {getPlan("report").features.map((f) => (
                <li key={f} className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0" aria-hidden />
                  {f}
                </li>
              ))}
            </ul>
            <Button size="lg" className="mt-5 w-full sm:w-auto" onClick={() => setCheckoutOpen(true)}>
              Unlock full report + ATS resume · {reportPrice}
            </Button>
            <p className="mt-2 text-caption opacity-90">One-time · UPI, cards and netbanking</p>
          </section>
        ) : null}

        {pillars.map((p, i) => {
          if (!report.unlocked && p === freePillar) return null
          if (isLocked(p)) return <LockedPillarCard key={p.key} pillar={p} />
          return (
            <div key={p.key} className="flex flex-col gap-2">
              <PillarCard pillar={p} index={i} reveal={justUnlocked} />
              {p.key === "github" && p.status === "not_assessed" ? (
                githubAvailable ? (
                  <a href="/api/github/connect?next=/report" className={cn(buttonVariants({ variant: "outline" }), "self-start")}>
                    <GitHubIcon className="size-4" />
                    Connect GitHub to include this
                  </a>
                ) : (
                  <p className="px-1 text-caption text-muted-foreground">GitHub connection isn&apos;t set up on this server yet.</p>
                )
              ) : null}
            </div>
          )
        })}
      </div>

      <div className="mt-8 flex flex-col items-start gap-2 border-t border-border pt-6 text-sm text-muted-foreground">
        <p>
          Changed your resume or projects? Re-check to update your score. The same details always give the same score.
          {githubConnected ? " Your GitHub is connected." : ""}
        </p>
        <Button variant="ghost" onClick={() => void run()} className="-ml-4">
          <RefreshCw aria-hidden />
          Re-check my profile
        </Button>
      </div>

      <CheckoutSheet
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        options={purchasable.filter((p) => p === "report" || p === "bundle")}
        defaultProduct={purchasable.includes("report") ? "report" : "bundle"}
        demo={demo}
        onPaid={() => void onPaid()}
      />
    </div>
  )
}

function Intro({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl px-4 pt-6 sm:px-6 md:pt-10">
      <h1 className="text-h1 font-normal md:text-h1-lg">How do you stack up?</h1>
      <p className="mt-2 text-muted-foreground md:text-lg">
        An honest check of your profile against what product-company screeners look for, with exactly what to fix.
      </p>
      <div className="mt-6">{children}</div>
    </div>
  )
}

function OverallCard({ report, needWork, animate }: { report: VisibleReport; needWork: number; animate: boolean }) {
  const value = useCountUp(report.overall, animate)
  return (
    <section className="mt-5 rounded-2xl border border-border bg-card p-5 md:p-6" aria-labelledby="overall-title">
      <h2 id="overall-title" className="sr-only">
        Overall score
      </h2>
      <div className="flex items-end gap-5">
        <p className="tabular font-mono text-[3.5rem] leading-none md:text-[4.5rem]" aria-label={`${report.overall} out of 100`}>
          {value}
          <span className="text-xl text-muted-foreground">/100</span>
        </p>
        <ScoreBar score={report.overall} className="mb-2 flex-1" />
      </div>
      <p className="mt-4 text-base">
        {report.overall >= RUBRIC_TARGET
          ? "You're above the LaunchPad Rubric Target. Polish the details and you're ready to apply."
          : needWork > 0
            ? `${needWork} of 5 areas need work before you clear a product-company screen.`
            : "You're close. A few fixes will get you over the line."}
      </p>
      <p className="mt-2 text-caption text-muted-foreground">
        {report.source === "ai"
          ? "Checks judged with AI help; the score is calculated from the LaunchPad Rubric."
          : "Checks judged by fixed rules; the score is calculated from the LaunchPad Rubric."}{" "}
        GitHub counts only when connected.
      </p>
    </section>
  )
}
