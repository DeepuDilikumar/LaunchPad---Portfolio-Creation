"use client"

import { AlertCircle, Check, FileUp, Loader2, PencilLine, ShieldCheck } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useRef, useState, type DragEvent } from "react"

import { Button, buttonVariants } from "@/components/ui/button"
import { track } from "@/lib/analytics/client"
import { setDraft, setDraftFile, useDraft } from "@/lib/draft/draft-store"
import { mergeAutofill } from "@/lib/draft/merge"
import { refineInBackground } from "@/lib/draft/refine"
import { PROFILE_FIELDS, emptyProfile, type ProfileField } from "@/lib/profile/types"
import { ResumeReadError, extractResumeText } from "@/lib/resume/extract-text"
import { extractResumeProfile } from "@/lib/resume/parse-profile"
import { cn } from "@/lib/utils"
import { AttachedFileCard } from "./attached-file-card"
import { FlowPage } from "./flow-chrome"

type Stage = "idle" | "reading" | "filling" | "done" | "error"

const STAGES: { key: Stage; label: string }[] = [
  { key: "reading", label: "Reading your resume" },
  { key: "filling", label: "Filling in your details" },
]

/** Processes a resume file entirely in the browser and stores the result in the draft. */
export async function attachResume(file: File) {
  const extracted = await extractResumeText(file)
  const parsed = extractResumeProfile(extracted.text)
  const attachedAt = Date.now()
  setDraft((d) => {
    // A new file replaces earlier auto-filled values but keeps the student's own edits.
    const blank = emptyProfile()
    const base = { ...d.profile }
    const userSources: typeof d.fieldSources = {}
    for (const field of PROFILE_FIELDS) {
      if (d.fieldSources[field] === "user") userSources[field] = "user"
      else (base as Record<ProfileField, unknown>)[field] = blank[field]
    }
    const merged = mergeAutofill(base, userSources, parsed.profile, "resume")
    return {
      ...d,
      profile: merged.profile,
      fieldSources: merged.fieldSources,
      autofilled: parsed.filled.filter((f) => merged.fieldSources[f] === "resume"),
      bannerDismissed: false,
      resume: {
        fileName: file.name,
        size: file.size,
        mime: file.type || "application/octet-stream",
        format: extracted.format,
        layout: extracted.layout,
        hasTables: extracted.hasTables,
        pages: extracted.pages,
        text: extracted.text,
        attachedAt,
      },
      refinement: "idle",
      template: d.templateChosen ? d.template : null,
    }
  })
  await setDraftFile(file)
  track("upload", { format: extracted.format, fieldsFilled: parsed.filled.length })
  void refineInBackground(extracted.text, attachedAt)
  return parsed.filled.length
}

export function UploadStep() {
  const router = useRouter()
  const { draft, ready } = useDraft()
  const inputRef = useRef<HTMLInputElement>(null)
  const [stage, setStage] = useState<Stage>("idle")
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  async function handleFile(file: File | undefined) {
    if (!file) return
    setError(null)
    setStage("reading")
    try {
      // Let "Reading" paint before the (fast) work starts, so the step list is honest and visible.
      await new Promise((r) => setTimeout(r, 50))
      const readPromise = attachResume(file)
      setStage("filling")
      await readPromise
      setStage("done")
      router.push("/start/profile")
    } catch (e) {
      setStage("error")
      setError(e instanceof ResumeReadError ? e.message : "Something went wrong reading that file. Try again, or fill in your details manually.")
    } finally {
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  function onDrop(event: DragEvent) {
    event.preventDefault()
    setDragging(false)
    void handleFile(event.dataTransfer.files?.[0])
  }

  const busy = stage === "reading" || stage === "filling" || stage === "done"
  const hasResume = ready && draft.resume && draft.resume.format !== "Manual"

  return (
    <FlowPage
      step="upload"
      title="Upload your resume"
      lead="We'll fill in your details from it. You just check and tweak."
      footer={
        hasResume && !busy ? (
          <Link href="/start/profile" className={cn(buttonVariants({ size: "lg" }), "w-full md:w-auto")}>
            Continue
          </Link>
        ) : null
      }
    >
      <input
        ref={inputRef}
        id="resume-file"
        type="file"
        accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
        className="sr-only"
        onChange={(e) => void handleFile(e.target.files?.[0])}
        tabIndex={-1}
      />

      {hasResume && !busy ? (
        <AttachedFileCard onReplace={() => inputRef.current?.click()} />
      ) : busy ? (
        <div role="status" aria-live="polite" className="rounded-2xl bg-surface p-6">
          <ul className="flex flex-col gap-3">
            {STAGES.map((s) => {
              const order = ["reading", "filling", "done"]
              const done = order.indexOf(stage) > order.indexOf(s.key)
              const active = stage === s.key
              return (
                <li key={s.key} className="flex items-center gap-3 text-base">
                  <span
                    className={cn(
                      "flex size-7 items-center justify-center rounded-full",
                      done ? "bg-primary text-primary-foreground" : "bg-tonal text-tonal-foreground"
                    )}
                  >
                    {done ? <Check className="size-4" aria-hidden /> : active ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                  </span>
                  <span className={cn(done || active ? "text-foreground" : "text-muted-foreground")}>{s.label}</span>
                </li>
              )
            })}
          </ul>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            "flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors duration-(--dur-fast)",
            dragging ? "border-primary bg-tonal" : "border-border bg-surface"
          )}
        >
          <span className="flex size-14 items-center justify-center rounded-full bg-tonal text-tonal-foreground">
            <FileUp className="size-7" aria-hidden />
          </span>
          <div>
            <p className="text-h3 font-medium">
              <span className="hidden md:inline">Drop your resume here, or </span>
              <span className="md:hidden">Pick your resume file</span>
              <span className="hidden md:inline">choose a file</span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">PDF, DOCX or TXT · up to 5 MB</p>
          </div>
          <Button size="lg" onClick={() => inputRef.current?.click()} className="w-full sm:w-auto">
            Choose file
          </Button>
        </div>
      )}

      {error ? (
        <div role="alert" className="mt-4 flex gap-3 rounded-2xl bg-danger-bg p-4 text-danger">
          <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden />
          <div className="text-sm">
            <p className="font-medium">We couldn&apos;t read that file</p>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      ) : null}

      <p className="mt-5 flex items-start gap-2 text-sm text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent-text" aria-hidden />
        Your resume stays private. It&apos;s read on your device, and saved only when you publish.
      </p>

      {!busy ? (
        <div className="mt-8 border-t border-border pt-6">
          <Link
            href="/start/profile?manual=1"
            className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-accent-text hover:underline"
          >
            <PencilLine className="size-4" aria-hidden />
            No resume handy? Fill in your details instead
          </Link>
        </div>
      ) : null}
    </FlowPage>
  )
}
