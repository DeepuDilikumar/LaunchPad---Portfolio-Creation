"use client"

import { AlertTriangle, Check, Copy, Download, Eye, FileCode, Loader2, Pencil, RotateCcw, X } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { Button, buttonVariants } from "@/components/ui/button"
import { TextArea } from "@/components/ui/field"
import { ResponsiveSheet } from "@/components/ui/responsive-sheet"
import { toast } from "@/components/ui/toaster"
import type { Profile } from "@/lib/profile/types"
import { buildResumeDocument, chosenText, hasPlaceholder, type RewriteBullet } from "@/lib/resume/document"
import { toLatex } from "@/lib/resume/latex"
import { cn } from "@/lib/utils"
import { ResumePreview, WithPlaceholders } from "./resume-preview"

export function ResumeRewriter({
  profile,
  initialBullets,
  initialSource,
}: {
  profile: Profile
  initialBullets: RewriteBullet[] | null
  initialSource: "ai" | "rules" | null
}) {
  const [bullets, setBullets] = useState<RewriteBullet[] | null>(initialBullets)
  const [source, setSource] = useState(initialSource)
  const [loading, setLoading] = useState(!initialBullets)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const dirty = useRef<Map<string, RewriteBullet>>(new Map())

  const generate = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const r = await fetch("/api/resume/rewrite", { method: "POST" })
      const data = await r.json()
      if (!r.ok) throw new Error(data?.error?.message ?? "Suggestions didn't load.")
      setBullets(data.bullets)
      setSource(data.source)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Suggestions didn't load. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (initialBullets) return
    const handle = setTimeout(() => void generate(), 0)
    return () => clearTimeout(handle)
  }, [initialBullets, generate])

  // Auto-save decisions shortly after each change.
  useEffect(() => {
    const handle = setInterval(() => {
      if (!dirty.current.size) return
      const payload = [...dirty.current.values()].map(({ id, status, final }) => ({ id, status, final }))
      dirty.current.clear()
      void fetch("/api/resume/rewrite", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ bullets: payload }),
      }).catch(() => toast("Couldn't save your last change. Check your connection."))
    }, 700)
    return () => clearInterval(handle)
  }, [])

  function decide(id: string, patch: Partial<RewriteBullet>) {
    setBullets((list) =>
      (list ?? []).map((b) => {
        if (b.id !== id) return b
        const next = { ...b, ...patch }
        dirty.current.set(id, next)
        return next
      })
    )
  }

  const doc = useMemo(() => buildResumeDocument(profile, bullets ?? []), [profile, bullets])
  const reviewed = (bullets ?? []).filter((b) => b.status !== "pending").length
  const placeholdersLeft = (bullets ?? []).filter((b) => b.status !== "rejected" && b.status !== "pending" && hasPlaceholder(chosenText(b))).length

  async function copyLatex() {
    try {
      await navigator.clipboard.writeText(toLatex(doc))
      toast("LaTeX copied. Paste it into a new Overleaf project.")
    } catch {
      toast("Couldn't copy. Use Download .tex instead.")
    }
  }

  function downloadTex() {
    const blob = new Blob([toLatex(doc)], { type: "application/x-tex" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${(profile.fullName || "resume").replace(/[^a-zA-Z0-9]+/g, "-")}-resume.tex`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const exportActions = (
    <div className="grid grid-cols-2 gap-2">
      <Button variant="outline" onClick={() => void copyLatex()}>
        <Copy aria-hidden />
        Copy LaTeX
      </Button>
      <Button variant="outline" onClick={downloadTex}>
        <FileCode aria-hidden />
        Download .tex
      </Button>
    </div>
  )

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 pb-28 sm:px-6 md:pt-10 md:pb-12">
      <h1 className="text-h1 font-normal md:text-h1-lg">Fix my resume</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Stronger, ATS-friendly bullets. We never invent numbers: fill in the{" "}
        <mark className="rounded bg-warning-bg px-1 text-warning">[highlighted]</mark> blanks with real figures, or delete them.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="flex min-w-0 flex-col gap-3">
          {loading ? (
            <div role="status" aria-label="Rewriting your bullets" className="flex flex-col gap-3">
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Rewriting your bullets
              </p>
              {[0, 1, 2].map((i) => (
                <div key={i} className="skeleton h-32 rounded-2xl" />
              ))}
            </div>
          ) : error ? (
            <div role="alert" className="rounded-2xl bg-danger-bg p-4 text-sm text-danger">
              {error}{" "}
              <button type="button" onClick={() => void generate()} className="font-medium underline">
                Try again
              </button>
            </div>
          ) : bullets && bullets.length === 0 ? (
            <div className="rounded-2xl bg-surface p-6 text-sm">
              Your resume has no project or experience bullets yet. Add some in your portfolio details, then come back.
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                <span>
                  {reviewed} of {bullets?.length ?? 0} reviewed
                  {source === "ai" ? " · suggestions written with AI" : " · rule-based suggestions"}
                </span>
                <button
                  type="button"
                  className="min-h-11 font-medium text-accent-text hover:underline"
                  onClick={() => (bullets ?? []).filter((b) => b.status === "pending").forEach((b) => decide(b.id, { status: "accepted" }))}
                >
                  Accept all remaining
                </button>
              </div>
              {placeholdersLeft ? (
                <p className="flex items-start gap-2 rounded-2xl bg-warning-bg p-3 text-sm text-warning" role="status">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                  {placeholdersLeft} chosen bullet{placeholdersLeft === 1 ? " still has" : "s still have"} a [blank]. Edit it with a real number, or remove it.
                </p>
              ) : null}
              {(bullets ?? []).map((b) => (
                <article key={b.id} className="rounded-2xl border border-border bg-card p-4">
                  <p className="text-caption text-muted-foreground">{b.parent}</p>
                  <div className="mt-2 grid gap-3 md:grid-cols-2">
                    <div>
                      <p className="text-caption font-medium text-muted-foreground">Yours</p>
                      <p className={cn("mt-0.5 text-sm", (b.status === "accepted" || b.status === "edited") && "text-muted-foreground line-through")}>{b.original}</p>
                    </div>
                    <div>
                      <p className="text-caption font-medium text-accent-text">Suggested</p>
                      {editing === b.id ? (
                        <TextArea
                          autoFocus
                          aria-label="Edit bullet"
                          defaultValue={b.status === "edited" ? b.final : b.suggested}
                          onBlur={(e) => {
                            decide(b.id, { status: "edited", final: e.target.value.trim() })
                            setEditing(null)
                          }}
                          className="mt-1 text-sm"
                        />
                      ) : (
                        <p className={cn("mt-0.5 text-sm", b.status === "rejected" && "text-muted-foreground line-through")}>
                          <WithPlaceholders text={b.status === "edited" ? b.final : b.suggested} />
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-1 border-t border-border pt-2">
                    {b.status === "pending" || b.status === "rejected" ? (
                      <Button variant="tonal" size="sm" onClick={() => decide(b.id, { status: "accepted" })}>
                        <Check aria-hidden />
                        Accept
                      </Button>
                    ) : (
                      <span className="inline-flex h-10 items-center gap-1.5 rounded-full bg-success-bg px-3 text-sm font-medium text-success">
                        <Check className="size-4" aria-hidden />
                        {b.status === "edited" ? "Edited" : "Accepted"}
                      </span>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => setEditing(b.id)}>
                      <Pencil aria-hidden />
                      Edit
                    </Button>
                    {b.status !== "rejected" ? (
                      <Button variant="ghost" size="sm" onClick={() => decide(b.id, { status: "rejected" })}>
                        <X aria-hidden />
                        Keep mine
                      </Button>
                    ) : (
                      <span className="ml-1 text-caption text-muted-foreground">Keeping yours</span>
                    )}
                    {b.status !== "pending" ? (
                      <Button variant="ghost" size="sm" className="ml-auto" onClick={() => decide(b.id, { status: "pending" })} aria-label="Undo decision">
                        <RotateCcw aria-hidden />
                      </Button>
                    ) : null}
                  </div>
                </article>
              ))}
            </>
          )}
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-24 flex flex-col gap-3">
            <p className="text-sm font-medium">Preview</p>
            <div className="max-h-[calc(100dvh-16rem)] overflow-y-auto">
              <ResumePreview doc={doc} />
            </div>
            <a href="/api/resume/export/pdf" className={buttonVariants({ size: "lg" })}>
              <Download aria-hidden />
              Download PDF
            </a>
            {exportActions}
          </div>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-16 z-(--z-sticky) bg-background px-4 pt-3 pb-3 shadow-e3 lg:hidden">
        <div className="mx-auto grid max-w-2xl grid-cols-[auto_1fr] gap-2">
          <Button variant="outline" size="lg" onClick={() => setPreviewOpen(true)}>
            <Eye aria-hidden />
            Preview
          </Button>
          <a href="/api/resume/export/pdf" className={buttonVariants({ size: "lg" })}>
            <Download aria-hidden />
            Download PDF
          </a>
        </div>
      </div>

      <ResponsiveSheet open={previewOpen} onOpenChange={setPreviewOpen} title="Resume preview" wide footer={exportActions}>
        <ResumePreview doc={doc} />
      </ResponsiveSheet>
    </div>
  )
}
