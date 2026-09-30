"use client"

import { Check, Copy, ExternalLink, FilePlus2, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { inputClass } from "@/components/ui/field"
import { toast } from "@/components/ui/toaster"
import type { PitchKind } from "@/lib/data/records"
import { PITCH_KINDS, TONES, type Tone } from "@/lib/pitch/templates"
import { cn } from "@/lib/utils"

type Draft = { content: string; source: "ai" | "rules" }
const keyOf = (kind: PitchKind, tone: Tone) => `${kind}:${kind === "linkedin" ? tone : "default"}`

export function PitchStudio({ initial, aiEnabled }: { initial: Record<string, Draft>; aiEnabled: boolean }) {
  const router = useRouter()
  const [kind, setKind] = useState<PitchKind>("linkedin")
  const [tone, setTone] = useState<Tone>("humble")
  const [drafts, setDrafts] = useState<Record<string, Draft>>(initial)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [adding, setAdding] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const k = keyOf(kind, tone)
  const draft = drafts[k]

  const generate = useCallback(async (nextKind: PitchKind, nextTone: Tone) => {
    setBusy(true)
    setError(null)
    try {
      const r = await fetch("/api/pitch", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind: nextKind, tone: nextTone }),
      })
      const data = await r.json().catch(() => null)
      if (!r.ok) throw new Error(data?.error?.message ?? "The draft didn't load. Please try again.")
      setDrafts((d) => ({ ...d, [keyOf(nextKind, nextTone)]: { content: data.text, source: data.source } }))
    } catch (e) {
      setError(e instanceof Error ? e.message : "The draft didn't load.")
    } finally {
      setBusy(false)
    }
  }, [])

  // Do the work for them: the first draft is written as soon as they open a tab.
  useEffect(() => {
    if (drafts[k] || busy || error) return
    const handle = setTimeout(() => void generate(kind, tone), 0)
    return () => clearTimeout(handle)
  }, [k, kind, tone, drafts, busy, error, generate])

  function edit(content: string) {
    setDrafts((d) => ({ ...d, [k]: { content, source: d[k]?.source ?? "rules" } }))
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      void fetch("/api/pitch", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind, tone: kind === "linkedin" ? tone : "default", content, source: draft?.source ?? "rules" }),
      })
    }, 700)
  }

  async function copy() {
    if (!draft) return
    try {
      await navigator.clipboard.writeText(draft.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast("Couldn't copy. Select the text and copy it manually.")
    }
  }

  async function addToProfile() {
    if (!draft) return
    const bullets = draft.content
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
    setAdding(true)
    try {
      const r = await fetch("/api/program/add-to-profile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ bullets }),
      })
      const data = await r.json().catch(() => null)
      if (!r.ok) throw new Error(data?.error?.message ?? "Couldn't add it. Please try again.")
      toast("Added to your portfolio and resume.", { action: { label: "View", onClick: () => router.push("/portfolio") } })
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't add it.")
    } finally {
      setAdding(false)
    }
  }

  const meta = PITCH_KINDS.find((x) => x.kind === kind)!
  const placeholders = draft?.content.match(/\[[^\]]{1,40}\]/g)?.length ?? 0

  return (
    <div>
      <div className="grid grid-cols-2 gap-2" role="tablist" aria-label="What to write">
        {PITCH_KINDS.map((x) => (
          <button
            key={x.kind}
            role="tab"
            aria-selected={kind === x.kind}
            onClick={() => {
              setError(null)
              setKind(x.kind)
            }}
            className={cn(
              "h-11 rounded-full border text-sm transition-colors",
              kind === x.kind ? "border-transparent bg-tonal font-medium text-tonal-foreground" : "border-border text-muted-foreground hover:bg-muted"
            )}
          >
            {x.label}
          </button>
        ))}
      </div>

      <p className="mt-4 text-sm text-muted-foreground">{meta.hint}</p>

      {kind === "linkedin" ? (
        <div className="mt-3 flex gap-2" role="radiogroup" aria-label="Tone">
          {TONES.map((t) => (
            <button
              key={t.key}
              role="radio"
              aria-checked={tone === t.key}
              onClick={() => {
                setError(null)
                setTone(t.key)
              }}
              className={cn(
                "h-9 rounded-full px-4 text-sm",
                tone === t.key ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-4">
        <label htmlFor="pitch-text" className="sr-only">
          {meta.label}
        </label>
        {busy && !draft ? (
          <div className="flex flex-col gap-2 rounded-xl border border-border p-4" aria-label="Writing your draft">
            <div className="skeleton h-4 w-11/12 rounded" />
            <div className="skeleton h-4 w-full rounded" />
            <div className="skeleton h-4 w-3/4 rounded" />
            <div className="skeleton h-4 w-5/6 rounded" />
            <p className="mt-1 text-caption text-muted-foreground">Writing from the days you&apos;ve completed…</p>
          </div>
        ) : (
          <textarea
            id="pitch-text"
            value={draft?.content ?? ""}
            onChange={(e) => edit(e.target.value)}
            rows={kind === "dm" ? 7 : 12}
            className={cn(inputClass, "h-auto resize-y py-3 leading-relaxed")}
          />
        )}
        {error ? (
          <p className="mt-2 text-caption text-danger" role="alert">
            {error}
          </p>
        ) : null}
        <p className="mt-2 text-caption text-muted-foreground">
          {placeholders
            ? `Replace ${placeholders} [placeholder${placeholders === 1 ? "" : "s"}] with your real details before sharing. We never make up numbers.`
            : "Built only from work you've completed. Edit freely; it saves as you type."}
          {draft?.source === "rules" && aiEnabled ? " (Written from a template this time.)" : ""}
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Button size="lg" onClick={() => void copy()} disabled={!draft} className="w-full sm:w-auto">
          {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
          {copied ? "Copied" : "Copy"}
        </Button>
        {kind === "bullets" ? (
          <Button size="lg" variant="secondary" loading={adding} onClick={() => void addToProfile()} disabled={!draft} className="w-full sm:w-auto">
            <FilePlus2 aria-hidden />
            Add to portfolio &amp; resume
          </Button>
        ) : null}
        {kind === "linkedin" && draft ? (
          <a
            href="https://www.linkedin.com/feed/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-border px-6 text-sm font-medium hover:bg-muted"
          >
            Open LinkedIn
            <ExternalLink className="size-4" aria-hidden />
          </a>
        ) : null}
        <Button size="lg" variant="ghost" onClick={() => void generate(kind, tone)} loading={busy && Boolean(draft)} className="w-full sm:w-auto">
          <RefreshCw aria-hidden />
          Write another version
        </Button>
      </div>
    </div>
  )
}
