"use client"

import { CheckCircle2, Info, Loader2, Sparkles, X } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { applyUserEdit } from "@/lib/draft/merge"
import { setDraft, useDraft } from "@/lib/draft/draft-store"
import { FIELD_LABELS, type Profile, type ProfileField } from "@/lib/profile/types"
import { ResumeReadError } from "@/lib/resume/extract-text"
import { AttachedFileCard } from "./attached-file-card"
import { FlowPage } from "./flow-chrome"
import { ProfileForm, validateProfile, type ProfileErrors } from "./profile-form"
import { attachResume } from "./upload-step"
import { toast } from "@/components/ui/toaster"

export function ProfileStep() {
  const router = useRouter()
  const params = useSearchParams()
  const manual = params.get("manual") === "1"
  const { draft, ready } = useDraft()
  const [errors, setErrors] = useState<ProfileErrors>({})
  const [replacing, setReplacing] = useState(false)
  const replaceRef = useRef<HTMLInputElement>(null)

  function onChange<F extends ProfileField>(field: F, value: Profile[F]) {
    setDraft((d) => ({ ...d, ...applyUserEdit(d.profile, d.fieldSources, field, value) }))
    if (field in errors) setErrors((e) => ({ ...e, [field]: undefined }))
  }

  function onContinue() {
    const found = validateProfile(draft.profile)
    setErrors(found)
    const first = Object.keys(found)[0]
    if (first) {
      const el = document.getElementById(first)
      el?.closest("details")?.setAttribute("open", "")
      el?.focus()
      return
    }
    router.push("/start/template")
  }

  async function onReplace(file: File | undefined) {
    if (!file) return
    setReplacing(true)
    try {
      const count = await attachResume(file)
      toast(`Read your new resume. Filled ${count} details (your own edits are kept).`)
    } catch (e) {
      toast(e instanceof ResumeReadError ? e.message : "We couldn't read that file. Try another one.")
    } finally {
      setReplacing(false)
      if (replaceRef.current) replaceRef.current.value = ""
    }
  }

  if (!ready) {
    return (
      <FlowPage step="details" title="Check your details">
        <div className="flex flex-col gap-3" role="status" aria-label="Loading your details">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-16 rounded-2xl" />
          ))}
        </div>
      </FlowPage>
    )
  }

  const filledCount = draft.autofilled.length
  const showBanner = !draft.bannerDismissed && filledCount > 0 && Boolean(draft.resume)

  return (
    <FlowPage
      step="details"
      title="Check your details"
      lead={
        draft.resume
          ? "Everything below came from your resume. Fix anything that's off."
          : "Fill in what you can. You can always change it later."
      }
      footer={
        <>
          <Button size="lg" onClick={onContinue} className="w-full md:w-auto">
            Continue
          </Button>
          <Link href="/start" className="hidden text-sm font-medium text-accent-text hover:underline md:inline">
            Back
          </Link>
        </>
      }
    >
      <input
        ref={replaceRef}
        type="file"
        accept=".pdf,.docx,.txt"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => void onReplace(e.target.files?.[0])}
      />

      {showBanner ? (
        <div className="mb-4 flex items-start gap-3 rounded-2xl bg-tonal p-4 text-tonal-foreground" role="status">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden />
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-medium">
              We filled {filledCount} {filledCount === 1 ? "detail" : "details"} from your resume. Check them below.
            </p>
            <p className="mt-1 opacity-90">{draft.autofilled.map((f) => FIELD_LABELS[f]).join(", ")}</p>
            {draft.refinement === "pending" ? (
              <p className="mt-2 inline-flex items-center gap-1.5">
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
                Double-checking with AI. Anything you edit stays as you wrote it.
              </p>
            ) : draft.refinement === "done" ? (
              <p className="mt-2 inline-flex items-center gap-1.5">
                <Sparkles className="size-3.5" aria-hidden />
                AI double-check done.
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => setDraft((d) => ({ ...d, bannerDismissed: true }))}
            className="-m-2 flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-background/40"
            aria-label="Dismiss"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      ) : null}

      {draft.resume ? (
        <div className="mb-4">
          {replacing ? (
            <div className="flex items-center gap-2 rounded-2xl bg-surface p-4 text-sm" role="status">
              <Loader2 className="size-4 animate-spin" aria-hidden /> Reading your new resume
            </div>
          ) : (
            <AttachedFileCard onReplace={() => replaceRef.current?.click()} />
          )}
        </div>
      ) : manual || !draft.resume ? (
        <p className="mb-4 flex items-start gap-2 rounded-2xl bg-surface p-4 text-sm text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0 text-accent-text" aria-hidden />
          <span>
            Have a resume file?{" "}
            <Link href="/start" className="font-medium text-accent-text hover:underline">
              Upload it
            </Link>{" "}
            and we&apos;ll fill this in for you.
          </span>
        </p>
      ) : null}

      <ProfileForm profile={draft.profile} sources={draft.fieldSources} errors={errors} onChange={onChange} />
    </FlowPage>
  )
}
