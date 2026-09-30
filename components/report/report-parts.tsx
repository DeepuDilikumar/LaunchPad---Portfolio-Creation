import { AlertTriangle, Check, ChevronDown, CircleSlash, Lock, OctagonAlert, X } from "lucide-react"

import type { LockedPillar, PillarResult, PillarStatus } from "@/lib/diagnostic/types"
import { RUBRIC_TARGET } from "@/lib/prompts/diagnostic"
import { cn } from "@/lib/utils"

const STATUS: Record<PillarStatus, { label: string; className: string; Icon: typeof Check }> = {
  passing: { label: "Passing", className: "bg-success-bg text-success", Icon: Check },
  needs_work: { label: "Needs work", className: "bg-warning-bg text-warning", Icon: AlertTriangle },
  critical: { label: "Critical", className: "bg-danger-bg text-danger", Icon: OctagonAlert },
  not_assessed: { label: "Not assessed", className: "bg-muted text-muted-foreground", Icon: CircleSlash },
}

/** Status is never colour-only: icon + label always. */
export function StatusPill({ status, className }: { status: PillarStatus; className?: string }) {
  const s = STATUS[status]
  return (
    <span className={cn("inline-flex h-7 shrink-0 items-center gap-1 rounded-full px-2.5 text-caption font-medium", s.className, className)}>
      <s.Icon className="size-3.5" aria-hidden />
      {s.label}
    </span>
  )
}

/** Horizontal score bar with the LaunchPad Rubric Target marker (easier to read than a gauge at 375px). */
export function ScoreBar({ score, className }: { score: number; className?: string }) {
  return (
    <div className={cn("relative pt-5", className)}>
      <div
        className="relative h-2.5 overflow-hidden rounded-full bg-muted"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={score}
        aria-label={`Score ${score} out of 100. LaunchPad Rubric Target is ${RUBRIC_TARGET}.`}
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-(--dur-slow) ease-out-expo",
            score >= RUBRIC_TARGET ? "bg-success" : score >= 60 ? "bg-warning" : "bg-danger"
          )}
          style={{ width: `${score}%` }}
        />
      </div>
      <div className="absolute top-0 h-full" style={{ left: `${RUBRIC_TARGET}%` }} aria-hidden>
        <span className="absolute -top-0.5 -translate-x-1/2 text-[0.6875rem] whitespace-nowrap text-muted-foreground">
          Target {RUBRIC_TARGET}
        </span>
        <span className="absolute top-4 h-4.5 w-0.5 -translate-x-1/2 rounded-full bg-foreground" />
      </div>
    </div>
  )
}

export function PillarCard({ pillar, index, reveal }: { pillar: PillarResult; index?: number; reveal?: boolean }) {
  const metCount = pillar.checks.filter((c) => c.met).length
  return (
    <article
      className={cn("rounded-2xl border border-border bg-card p-5", reveal && "animate-rise")}
      style={reveal && index !== undefined ? { animationDelay: `${index * 60}ms` } : undefined}
      aria-labelledby={`pillar-${pillar.key}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 id={`pillar-${pillar.key}`} className="text-h3 font-medium">
            {pillar.title}
          </h3>
          <p className="mt-0.5 text-sm text-muted-foreground">{pillar.short}</p>
        </div>
        <StatusPill status={pillar.status} />
      </div>

      {pillar.score !== null ? (
        <div className="mt-4 flex items-end gap-4">
          <p className="tabular shrink-0 font-mono text-[2rem] leading-none">
            {pillar.score}
            <span className="text-base text-muted-foreground">/100</span>
          </p>
          <ScoreBar score={pillar.score} className="flex-1" />
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div>
          <h4 className="text-sm font-medium">What a screener notices</h4>
          <ul className="mt-1.5 flex flex-col gap-1.5 text-sm text-muted-foreground">
            {pillar.notices.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </div>
        {pillar.fixes.length ? (
          <div>
            <h4 className="text-sm font-medium">How to fix it</h4>
            <ol className="mt-1.5 flex list-decimal flex-col gap-1.5 pl-5 text-sm">
              {pillar.fixes.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ol>
          </div>
        ) : null}
      </div>

      {pillar.status !== "not_assessed" ? (
        <details className="group mt-4 rounded-xl bg-surface">
          <summary className="flex min-h-11 list-none items-center justify-between px-4 text-sm font-medium text-accent-text [&::-webkit-details-marker]:hidden">
            How this was scored · {metCount} of {pillar.checks.length} checks met
            <ChevronDown className="size-4 transition-transform duration-(--dur-base) group-open:rotate-180" aria-hidden />
          </summary>
          <ul className="flex flex-col gap-3 border-t border-border px-4 py-3">
            {pillar.checks.map((c) => (
              <li key={c.id} className="flex gap-3 text-sm">
                <span
                  className={cn(
                    "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full",
                    c.met ? "bg-success-bg text-success" : "bg-danger-bg text-danger"
                  )}
                >
                  {c.met ? <Check className="size-3.5" aria-label="Met" /> : <X className="size-3.5" aria-label="Not met" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex justify-between gap-2">
                    <span>{c.label}</span>
                    <span className="tabular shrink-0 font-mono text-caption text-muted-foreground">{c.weight} pts</span>
                  </span>
                  <span className="block text-caption text-muted-foreground">{c.evidence}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="border-t border-border px-4 py-3 text-caption text-muted-foreground">
            Score = points from checks met, out of 100. Compared with the LaunchPad Rubric Target of {RUBRIC_TARGET}, our own
            bar for product-company SDE-1 screens, not an industry standard.
          </p>
        </details>
      ) : null}
    </article>
  )
}

export function LockedPillarCard({ pillar }: { pillar: LockedPillar }) {
  return (
    <article className="relative overflow-hidden rounded-2xl border border-border bg-card p-5" aria-labelledby={`pillar-${pillar.key}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 id={`pillar-${pillar.key}`} className="text-h3 font-medium">
            {pillar.title}
          </h3>
          <p className="mt-0.5 text-sm text-muted-foreground">{pillar.short}</p>
        </div>
        <StatusPill status={pillar.status} />
      </div>
      <div className="mt-4 select-none blur-[6px]" aria-hidden>
        <div className="h-2.5 w-3/4 rounded-full bg-muted" />
        <div className="mt-4 h-3 w-full rounded bg-muted" />
        <div className="mt-2 h-3 w-5/6 rounded bg-muted" />
        <div className="mt-2 h-3 w-2/3 rounded bg-muted" />
      </div>
      <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
        <Lock className="size-4" aria-hidden />
        Unlock to see the score, what screeners notice and how to fix it.
      </p>
    </article>
  )
}
