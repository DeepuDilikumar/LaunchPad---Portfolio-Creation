"use client"

import { ChevronDown, FileText, RefreshCw, Trash2 } from "lucide-react"

import { toast } from "@/components/ui/toaster"
import { getDraftFile, setDraft, setDraftFile, useDraft } from "@/lib/draft/draft-store"
import { cn } from "@/lib/utils"

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function AttachedFileCard({ onReplace, className }: { onReplace: () => void; className?: string }) {
  const { draft, ready } = useDraft()
  const resume = draft.resume
  if (!ready || !resume || resume.format === "Manual") return null

  async function remove() {
    const previous = draft.resume
    const file = await getDraftFile()
    setDraft((d) => ({ ...d, resume: null, refinement: "idle" }))
    await setDraftFile(null)
    toast("Resume removed. Your details are still here.", {
      action: {
        label: "Undo",
        onClick: () => {
          setDraft((d) => ({ ...d, resume: previous }))
          if (file) void setDraftFile(file)
        },
      },
      duration: 6000,
    })
  }

  const layoutNote =
    resume.layout === "two-column" ? " · two-column layout" : resume.layout === "single-column" ? " · single column" : ""

  return (
    <div className={cn("rounded-2xl border border-border bg-card", className)}>
      <div className="flex items-start gap-3 p-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-tonal text-tonal-foreground">
          <FileText className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-caption text-muted-foreground">Attached</p>
          <p className="font-medium [overflow-wrap:anywhere]">{resume.fileName}</p>
          <p className="mt-0.5 font-mono text-caption text-muted-foreground">
            {resume.format} · {formatBytes(resume.size)}
            {resume.format === "PDF" ? ` · ${resume.pages} page${resume.pages === 1 ? "" : "s"}` : ""}
            {layoutNote}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1 border-t border-border px-2 py-1.5">
        <button
          type="button"
          onClick={onReplace}
          className="inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-medium text-accent-text hover:bg-tonal/60"
        >
          <RefreshCw className="size-4" aria-hidden />
          Replace
        </button>
        <button
          type="button"
          onClick={() => void remove()}
          className="inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-medium text-danger hover:bg-danger-bg"
        >
          <Trash2 className="size-4" aria-hidden />
          Remove
        </button>
      </div>
      <details className="group border-t border-border">
        <summary className="flex h-12 list-none items-center justify-between px-4 text-sm font-medium text-muted-foreground hover:text-foreground [&::-webkit-details-marker]:hidden">
          View extracted text
          <ChevronDown className="size-4 transition-transform duration-(--dur-base) group-open:rotate-180" aria-hidden />
        </summary>
        <pre className="max-h-72 overflow-auto border-t border-border bg-surface px-4 py-3 font-mono text-caption leading-relaxed whitespace-pre-wrap text-muted-foreground">
          {resume.text}
        </pre>
      </details>
    </div>
  )
}
