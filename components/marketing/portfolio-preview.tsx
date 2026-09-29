import type { CSSProperties, ReactNode } from "react"

import type { SampleProfile, TemplateKey } from "@/content/samples"
import { cn } from "@/lib/utils"

/**
 * A miniature, non-interactive portfolio rendered in HTML (no images → fast, crisp, theme-aware).
 * Used by the hero "after" visual and the sample gallery. The three templates
 * preview the real ones that arrive with the portfolio generator.
 */

type PreviewProfile = Pick<
  SampleProfile,
  "slug" | "name" | "initials" | "role" | "summary" | "skills" | "project"
>

export function PhoneFrame({
  url,
  children,
  className,
}: {
  url: string
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[22px] border border-border bg-card shadow-lg ring-4 ring-muted",
        className
      )}
    >
      <div className="flex items-center gap-1.5 border-b border-border bg-surface px-2.5 py-1.5">
        <span className="size-1.5 shrink-0 rounded-full bg-success" aria-hidden />
        <span className="truncate font-mono text-[9px] leading-none text-muted-foreground">
          {url}
        </span>
      </div>
      {children}
    </div>
  )
}

/** Staggered entrance for preview rows; disabled automatically under reduced motion. */
function rise(index: number, animate: boolean): { className?: string; style?: CSSProperties } {
  if (!animate) return {}
  return { className: "animate-rise", style: { animationDelay: `${120 + index * 60}ms` } }
}

export function PortfolioPreview({
  profile,
  template,
  animate = false,
  className,
}: {
  profile: PreviewProfile
  template: TemplateKey
  animate?: boolean
  className?: string
}) {
  const r = (i: number) => rise(i, animate)
  const progress = profile.project.builtInDays

  const hero =
    template === "bold" ? (
      <div {...r(0)} className={cn("bg-primary px-3 pt-4 pb-3 text-primary-foreground", r(0).className)}>
        <p className="text-[15px] leading-tight font-semibold tracking-tight">{profile.name}</p>
        <p className="mt-0.5 text-[10px]">{profile.role}</p>
      </div>
    ) : template === "developer" ? (
      <div {...r(0)} className={cn("px-3 pt-3", r(0).className)}>
        <p className="font-mono text-[9px] text-muted-foreground">~/{profile.slug.replace("sample-", "")}</p>
        <p className="mt-1 text-[14px] leading-tight font-semibold tracking-tight">{profile.name}</p>
        <p className="font-mono text-[10px] text-accent-text">{`> ${profile.role}`}</p>
      </div>
    ) : (
      <div {...r(0)} className={cn("flex items-center gap-2 px-3 pt-3", r(0).className)}>
        <span
          className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold"
          aria-hidden
        >
          {profile.initials}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[13px] leading-tight font-semibold tracking-tight">{profile.name}</p>
          <p className="truncate text-[10px] text-muted-foreground">{profile.role}</p>
        </div>
      </div>
    )

  return (
    <div className={cn("flex flex-col gap-2.5 pb-3 text-left", className)}>
      {hero}

      <p {...r(1)} className={cn("px-3 text-[10px] leading-snug text-muted-foreground", r(1).className)}>
        {profile.summary}
      </p>

      <ul {...r(2)} className={cn("flex flex-wrap gap-1 px-3", r(2).className)}>
        {profile.skills.map((skill) => (
          <li
            key={skill}
            className={cn(
              "rounded-full border border-border px-1.5 py-0.5 text-[9px] leading-none",
              template === "developer" && "font-mono"
            )}
          >
            {skill}
          </li>
        ))}
      </ul>

      <div
        {...r(3)}
        className={cn("mx-3 rounded-lg border border-border bg-surface p-2", r(3).className)}
      >
        <p className="text-[8px] text-muted-foreground">Featured project</p>
        <p className="mt-0.5 text-[11px] leading-tight font-semibold">{profile.project.title}</p>
        <p className="mt-0.5 font-mono text-[8.5px] text-muted-foreground">
          {profile.project.stack.join(" · ")}
        </p>
        {progress ? (
          <div className="mt-1.5">
            <div className="flex items-center justify-between text-[8px]">
              <span className="font-semibold text-accent-text">
                {progress.day === progress.of ? "Built in 14 days" : "Building · 14-day program"}
              </span>
              <span className="tabular font-mono text-muted-foreground">
                Day {progress.day}/{progress.of}
              </span>
            </div>
            <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${(progress.day / progress.of) * 100}%` }}
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
