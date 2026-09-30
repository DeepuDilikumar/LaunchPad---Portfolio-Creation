"use client"

import { AlertCircle, ArrowDown, ArrowUp, Check, Copy, Eye, EyeOff, ExternalLink, Loader2 } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

import { ProfileForm, validateProfile } from "@/components/flow/profile-form"
import { Button } from "@/components/ui/button"
import { Field, TextArea, TextInput } from "@/components/ui/field"
import { toast } from "@/components/ui/toaster"
import { SECTIONS, TEMPLATES, type PortfolioContent, type ProgramBadge, type SectionKey } from "@/lib/portfolio/types"
import type { Profile, ProfileField } from "@/lib/profile/types"
import { cn } from "@/lib/utils"
import { PortfolioView } from "./portfolio-view"

type SaveState = "saved" | "dirty" | "saving" | "error"

export function PortfolioEditor({
  initial,
  slug,
  url,
  initiallyPublished,
  badge,
}: {
  initial: PortfolioContent
  slug: string
  url: string
  initiallyPublished: boolean
  badge: ProgramBadge | null
}) {
  const [content, setContent] = useState(initial)
  const [published, setPublishedState] = useState(initiallyPublished)
  const [save, setSave] = useState<SaveState>("saved")
  const [tab, setTab] = useState<"edit" | "preview">("edit")
  const latest = useRef(content)
  useEffect(() => {
    latest.current = content
  }, [content])

  const persist = useCallback(async (body: Record<string, unknown>) => {
    setSave("saving")
    try {
      const r = await fetch("/api/portfolio", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!r.ok) throw new Error()
      setSave("saved")
    } catch {
      setSave("error")
    }
  }, [])

  // Auto-save shortly after the last change.
  useEffect(() => {
    if (save !== "dirty") return
    const handle = setTimeout(() => void persist({ content: latest.current }), 800)
    return () => clearTimeout(handle)
  }, [content, save, persist])

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (save === "dirty" || save === "saving") e.preventDefault()
    }
    window.addEventListener("beforeunload", onBeforeUnload)
    return () => window.removeEventListener("beforeunload", onBeforeUnload)
  }, [save])

  function update(patch: Partial<PortfolioContent>) {
    setContent((c) => ({ ...c, ...patch }))
    setSave("dirty")
  }

  function updateProfile<F extends ProfileField>(field: F, value: Profile[F]) {
    setContent((c) => ({ ...c, profile: { ...c.profile, [field]: value } }))
    setSave("dirty")
  }

  function move(key: SectionKey, dir: -1 | 1) {
    const order = [...content.sectionOrder]
    const i = order.indexOf(key)
    const j = i + dir
    if (j < 0 || j >= order.length) return
    ;[order[i], order[j]] = [order[j], order[i]]
    update({ sectionOrder: order })
  }

  function toggle(key: SectionKey) {
    update({
      hiddenSections: content.hiddenSections.includes(key)
        ? content.hiddenSections.filter((k) => k !== key)
        : [...content.hiddenSections, key],
    })
  }

  async function togglePublished() {
    const next = !published
    setPublishedState(next)
    await persist({ isPublished: next })
    toast(next ? "Your portfolio is public again." : "Your portfolio is hidden. The link shows a 'not available' page.")
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      toast("Link copied")
    } catch {
      toast("Couldn't copy. Press and hold the link to copy it.")
    }
  }

  const errors = validateProfile(content.profile)

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 md:pt-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h1 className="text-h1 font-normal">Your portfolio</h1>
          <div className="mt-1 flex items-center gap-2 text-sm">
            <a href={`/p/${slug}`} target="_blank" rel="noopener noreferrer" className="truncate font-mono text-accent-text hover:underline">
              {url.replace(/^https?:\/\//, "")}
            </a>
            <button type="button" onClick={() => void copy()} className="flex size-9 shrink-0 items-center justify-center rounded-full hover:bg-muted" aria-label="Copy link">
              <Copy className="size-4" aria-hidden />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <SaveStatus state={save} onRetry={() => void persist({ content: latest.current })} />
          <Button variant="outline" size="sm" onClick={() => void togglePublished()}>
            {published ? <Eye aria-hidden /> : <EyeOff aria-hidden />}
            {published ? "Public" : "Hidden"}
          </Button>
          <a href={`/p/${slug}`} target="_blank" rel="noopener noreferrer" className="hidden h-10 items-center gap-2 rounded-full px-4 text-sm font-medium text-accent-text hover:bg-tonal/60 md:inline-flex">
            <ExternalLink className="size-4" aria-hidden />
            View live
          </a>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-1 rounded-full border border-border p-1 md:hidden" role="tablist" aria-label="Editor view">
        {(["edit", "preview"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn("h-10 rounded-full text-sm", tab === t ? "bg-tonal font-medium text-tonal-foreground" : "text-muted-foreground")}
          >
            {t === "edit" ? "Edit" : "Preview"}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <div className={cn("flex flex-col gap-4", tab === "preview" && "hidden md:flex")}>
          <section className="rounded-2xl border border-border bg-card p-4" aria-labelledby="ed-template">
            <h2 id="ed-template" className="text-base font-medium">Template</h2>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  aria-pressed={content.template === t.key}
                  onClick={() => update({ template: t.key })}
                  className={cn(
                    "h-11 rounded-xl border text-sm",
                    content.template === t.key ? "border-2 border-primary bg-tonal font-medium text-tonal-foreground" : "border-border hover:bg-muted"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4" aria-labelledby="ed-intro">
            <h2 id="ed-intro" className="text-base font-medium">Intro</h2>
            <Field label="Headline" htmlFor="ed-headline">
              {({ id }) => <TextInput id={id} value={content.headline} maxLength={120} onChange={(e) => update({ headline: e.target.value })} />}
            </Field>
            <Field label="About" htmlFor="ed-summary">
              {({ id }) => <TextArea id={id} value={content.summary} maxLength={600} onChange={(e) => update({ summary: e.target.value })} />}
            </Field>
            <label className="flex min-h-11 cursor-pointer items-center justify-between gap-4 text-sm">
              Show my phone number
              <input type="checkbox" checked={content.showPhone} onChange={(e) => update({ showPhone: e.target.checked })} className="size-5 accent-[var(--primary)]" />
            </label>
          </section>

          <section className="rounded-2xl border border-border bg-card p-4" aria-labelledby="ed-sections">
            <h2 id="ed-sections" className="text-base font-medium">Sections</h2>
            <p className="text-caption text-muted-foreground">Reorder or hide sections.</p>
            <ol className="mt-3 flex flex-col gap-1">
              {content.sectionOrder.map((key, i) => {
                const label = SECTIONS.find((s) => s.key === key)?.label ?? key
                const hidden = content.hiddenSections.includes(key)
                return (
                  <li key={key} className="flex items-center gap-1 rounded-xl bg-surface py-1 pr-1 pl-3">
                    <span className={cn("flex-1 text-sm", hidden && "text-muted-foreground line-through")}>{label}</span>
                    <button type="button" onClick={() => move(key, -1)} disabled={i === 0} className="flex size-10 items-center justify-center rounded-full hover:bg-muted disabled:opacity-30" aria-label={`Move ${label} up`}>
                      <ArrowUp className="size-4" aria-hidden />
                    </button>
                    <button type="button" onClick={() => move(key, 1)} disabled={i === content.sectionOrder.length - 1} className="flex size-10 items-center justify-center rounded-full hover:bg-muted disabled:opacity-30" aria-label={`Move ${label} down`}>
                      <ArrowDown className="size-4" aria-hidden />
                    </button>
                    <button type="button" onClick={() => toggle(key)} className="flex size-10 items-center justify-center rounded-full hover:bg-muted" aria-label={hidden ? `Show ${label}` : `Hide ${label}`} aria-pressed={!hidden}>
                      {hidden ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
                    </button>
                  </li>
                )
              })}
            </ol>
          </section>

          <div>
            <h2 className="mb-2 px-1 text-base font-medium">Your details</h2>
            <ProfileForm profile={content.profile} sources={{}} errors={errors} onChange={updateProfile} />
          </div>
        </div>

        <div className={cn("min-w-0", tab === "edit" && "hidden md:block")}>
          <div className="sticky top-20 overflow-hidden rounded-[28px] border border-border shadow-e2">
            <div className="flex items-center gap-2 border-b border-border bg-surface px-4 py-2">
              <span className={cn("size-2 rounded-full", published ? "bg-success" : "bg-muted-foreground")} aria-hidden />
              <span className="truncate font-mono text-caption text-muted-foreground">
                {published ? "Live" : "Hidden"} · /p/{slug}
              </span>
            </div>
            <div className="max-h-[calc(100dvh-10rem)] overflow-y-auto" tabIndex={0} aria-label="Portfolio preview">
              <PortfolioView content={content} badge={badge} compact />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SaveStatus({ state, onRetry }: { state: SaveState; onRetry: () => void }) {
  if (state === "error") {
    return (
      <button type="button" onClick={onRetry} className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm text-danger hover:bg-danger-bg">
        <AlertCircle className="size-4" aria-hidden />
        Not saved · Retry
      </button>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 text-caption text-muted-foreground" aria-live="polite">
      {state === "saved" ? <Check className="size-4 text-success" aria-hidden /> : <Loader2 className="size-4 animate-spin" aria-hidden />}
      {state === "saved" ? "Saved" : "Saving"}
    </span>
  )
}
