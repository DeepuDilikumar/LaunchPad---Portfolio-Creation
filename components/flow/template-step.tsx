"use client"

import { Check, Sparkles } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef } from "react"

import { PortfolioView } from "@/components/portfolio/portfolio-view"
import { Button } from "@/components/ui/button"
import { setDraft, useDraft } from "@/lib/draft/draft-store"
import { buildContent, fallbackSummary, recommendTemplate } from "@/lib/portfolio/build"
import { TEMPLATES, type TemplateKey } from "@/lib/portfolio/types"
import type { Profile } from "@/lib/profile/types"
import { cn } from "@/lib/utils"
import { FlowPage } from "./flow-chrome"

function fingerprint(profile: Profile) {
  return JSON.stringify([profile.targetRole, profile.college, profile.gradYear, profile.skills, profile.projects.map((p) => [p.title, p.description])])
}

/** Keeps the portfolio intro in sync with the profile (AI when available, else rule-based). */
export function useSummary() {
  const { draft, ready } = useDraft()
  const print = ready ? fingerprint(draft.profile) : ""
  const requested = useRef("")
  useEffect(() => {
    if (!ready || draft.summaryFor === print || requested.current === print) return
    requested.current = print
    setDraft((d) => ({ ...d, summary: d.summary || fallbackSummary(d.profile) }))
    fetch("/api/portfolio/summary", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ profile: draft.profile }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { summary: string } | null) => {
        // Ignore answers for an older version of the profile.
        if (!data?.summary || requested.current !== print) return
        setDraft((d) => ({ ...d, summary: data.summary, summaryFor: print }))
      })
      .catch(() => undefined)
  }, [ready, print, draft.summaryFor, draft.profile])
}

export function TemplateStep() {
  const router = useRouter()
  const { draft, ready } = useDraft()
  useSummary()

  const recommended = recommendTemplate(draft.profile.targetRole)
  const selected: TemplateKey = draft.template ?? recommended

  useEffect(() => {
    if (ready && !draft.template) setDraft((d) => ({ ...d, template: recommendTemplate(d.profile.targetRole) }))
  }, [ready, draft.template])

  const content = buildContent(draft.profile, selected, draft.summary || fallbackSummary(draft.profile))

  return (
    <FlowPage
      step="template"
      title="Pick a look"
      lead="We picked the best fit for your role. Switch anytime, even after publishing."
      footer={
        <>
          <Button size="lg" className="w-full md:w-auto" onClick={() => router.push("/start/publish")} disabled={!ready}>
            Continue with {TEMPLATES.find((t) => t.key === selected)?.label}
          </Button>
          <Link href="/start/profile" className="hidden text-sm font-medium text-accent-text hover:underline md:inline">
            Back
          </Link>
        </>
      }
    >
      <fieldset>
        <legend className="sr-only">Template</legend>
        <div className="grid grid-cols-3 gap-2">
          {TEMPLATES.map((t) => {
            const active = selected === t.key
            return (
              <label
                key={t.key}
                className={cn(
                  "relative flex cursor-pointer flex-col gap-0.5 rounded-2xl border p-3 transition-colors duration-(--dur-fast) has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring sm:p-4",
                  active ? "border-2 border-primary bg-tonal" : "border-border hover:bg-muted"
                )}
              >
                <input
                  type="radio"
                  name="template"
                  value={t.key}
                  checked={active}
                  onChange={() => setDraft((d) => ({ ...d, template: t.key, templateChosen: true }))}
                  className="sr-only"
                />
                <span className="flex items-center justify-between gap-1">
                  <span className={cn("text-sm font-medium", active && "text-tonal-foreground")}>{t.label}</span>
                  {active ? <Check className="size-4 text-accent-text" aria-hidden /> : null}
                </span>
                {t.key === recommended ? (
                  <span className="inline-flex items-center gap-1 text-[0.75rem] text-accent-text">
                    <Sparkles className="size-3" aria-hidden />
                    Best fit
                  </span>
                ) : (
                  <span className="text-[0.75rem] text-muted-foreground">&nbsp;</span>
                )}
                <span className="sr-only">{t.description}</span>
              </label>
            )
          })}
        </div>
        <p className="mt-3 text-sm text-muted-foreground" aria-live="polite">
          {TEMPLATES.find((t) => t.key === selected)?.description}
        </p>
      </fieldset>

      <div className="mt-5">
        <p className="mb-2 text-caption text-muted-foreground">Live preview with your details</p>
        <div className="overflow-hidden rounded-[28px] border border-border shadow-e2">
          <div className="flex items-center gap-2 border-b border-border bg-surface px-4 py-2">
            <span className="size-2 rounded-full bg-success" aria-hidden />
            <span className="truncate font-mono text-caption text-muted-foreground">
              launchpad.app/p/{draft.slug || "your-name"}
            </span>
          </div>
          <div className="max-h-[560px] overflow-y-auto" tabIndex={0} aria-label="Portfolio preview">
            {ready ? <PortfolioView content={content} compact /> : <div className="skeleton h-96" />}
          </div>
        </div>
      </div>
    </FlowPage>
  )
}
