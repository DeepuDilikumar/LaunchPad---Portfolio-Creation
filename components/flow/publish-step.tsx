"use client"

import { ArrowRight, Check, CheckCircle2, Copy, ExternalLink, Globe, Loader2, Lock, PencilLine, XCircle } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"

import { Button, buttonVariants } from "@/components/ui/button"
import { Field, TextArea } from "@/components/ui/field"
import { toast } from "@/components/ui/toaster"
import { track } from "@/lib/analytics/client"
import { getDraftFile, setDraft, useDraft } from "@/lib/draft/draft-store"
import { isValidSlug, slugify } from "@/lib/draft/merge"
import { fallbackSummary } from "@/lib/portfolio/build"
import { TEMPLATES } from "@/lib/portfolio/types"
import { cn } from "@/lib/utils"
import { FlowPage } from "./flow-chrome"
import { useSummary } from "./template-step"

type SlugState = { status: "idle" | "checking" | "ok" | "taken" | "invalid"; suggestion?: string }

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden focusable="false">
      <path
        fill="currentColor"
        d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.8-1.3a.5.5 0 0 0 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.4-.3Z"
      />
    </svg>
  )
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden focusable="false">
      <path
        fill="currentColor"
        d="M20.4 20.5h-3.6v-5.6c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9v5.7H9.3V9h3.4v1.6c.5-.9 1.6-1.8 3.4-1.8 3.6 0 4.3 2.4 4.3 5.5v6.2ZM5.3 7.4a2.1 2.1 0 1 1 0-4.2 2.1 2.1 0 0 1 0 4.2Zm1.8 13.1H3.5V9h3.6v11.5ZM22.2 0H1.8A1.8 1.8 0 0 0 0 1.7v20.6A1.8 1.8 0 0 0 1.8 24h20.4a1.8 1.8 0 0 0 1.8-1.7V1.7A1.8 1.8 0 0 0 22.2 0Z"
      />
    </svg>
  )
}

export function PublishStep({ signedIn, siteHost }: { signedIn: boolean; siteHost: string }) {
  const router = useRouter()
  const params = useSearchParams()
  const { draft, ready } = useDraft()
  useSummary()
  // The last server answer, tagged with the slug it was for. Everything else is derived.
  const [checked, setSlugState] = useState<SlugState & { slug?: string }>({ status: "idle" })
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [live, setLive] = useState<{ slug: string; url: string } | null>(null)
  const autoRan = useRef(false)

  // Default link from the name.
  useEffect(() => {
    if (ready && !draft.slug) {
      const s = slugify(draft.profile.fullName)
      if (s) setDraft((d) => ({ ...d, slug: s }))
    }
  }, [ready, draft.slug, draft.profile.fullName])

  // Check availability as they type (debounced).
  useEffect(() => {
    if (!ready || !draft.slug) return
    if (!isValidSlug(draft.slug)) return
    const slug = draft.slug
    const handle = setTimeout(async () => {
      try {
        const r = await fetch(`/api/portfolio/slug?slug=${encodeURIComponent(draft.slug)}`)
        const data = (await r.json()) as { available: boolean; suggestion: string }
        setSlugState(data.available ? { status: "ok", slug } : { status: "taken", suggestion: data.suggestion, slug })
      } catch {
        setSlugState({ status: "idle", slug })
      }
    }, 350)
    return () => clearTimeout(handle)
  }, [ready, draft.slug])

  const slugState: SlugState = !draft.slug
    ? { status: "idle" }
    : !isValidSlug(draft.slug)
      ? { status: "invalid" }
      : checked.slug !== draft.slug
        ? { status: "checking" }
        : checked

  const missing = !draft.profile.fullName.trim() || !draft.profile.email.trim()

  async function publish() {
    setError(null)
    if (missing) {
      router.push("/start/profile")
      return
    }
    setPublishing(true)
    try {
      const form = new FormData()
      form.set(
        "payload",
        JSON.stringify({
          profile: draft.profile,
          fieldSources: draft.fieldSources,
          template: draft.template ?? "minimal",
          summary: draft.summary,
          slug: draft.slug,
          showPhone: draft.showPhone,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          resume: draft.resume
            ? {
                fileName: draft.resume.fileName,
                mime: draft.resume.mime,
                size: draft.resume.size,
                format: draft.resume.format,
                layout: draft.resume.layout,
                hasTables: draft.resume.hasTables,
                text: draft.resume.text,
              }
            : null,
        })
      )
      const file = await getDraftFile()
      if (file) form.set("file", file)
      const response = await fetch("/api/portfolio/publish", { method: "POST", body: form })
      const data = await response.json().catch(() => ({}))
      if (response.status === 401) {
        router.push(`/login?next=${encodeURIComponent("/start/publish?auto=1")}`)
        return
      }
      if (!response.ok) {
        if (data?.error?.code === "slug_taken") {
          setSlugState({ status: "taken", suggestion: data.error.suggestion, slug: draft.slug })
        }
        setError(data?.error?.message ?? "Publishing didn't finish. Your details are saved; please try again.")
        return
      }
      setDraft((d) => ({ ...d, publishedSlug: data.slug }))
      track("portfolio_created", { template: draft.template ?? "minimal" })
      setLive(data)
    } catch {
      setError("You seem to be offline. Your details are saved; try again when you're connected.")
    } finally {
      setPublishing(false)
    }
  }

  // Coming back from sign-in: publish straight away (the draft was kept on this device).
  useEffect(() => {
    if (ready && signedIn && params.get("auto") === "1" && !autoRan.current && draft.slug) {
      autoRan.current = true
      void publish()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, signedIn, draft.slug])

  if (live) return <Celebration url={live.url} slug={live.slug} name={draft.profile.fullName} />

  const templateLabel = TEMPLATES.find((t) => t.key === (draft.template ?? "minimal"))?.label
  const canPublish = ready && !missing && slugState.status !== "taken" && slugState.status !== "invalid"

  return (
    <FlowPage
      step="publish"
      title="Ready to go live"
      lead="Choose your link and check your intro. You can change everything later."
      footer={
        <>
          {signedIn ? (
            <Button size="lg" className="w-full md:w-auto" loading={publishing} disabled={!canPublish} onClick={() => void publish()}>
              {publishing ? "Publishing" : "Publish my portfolio"}
            </Button>
          ) : (
            <Link
              href={`/login?next=${encodeURIComponent("/start/publish?auto=1")}`}
              className={cn(buttonVariants({ size: "lg" }), "w-full md:w-auto", !canPublish && "pointer-events-none opacity-50")}
              aria-disabled={!canPublish}
            >
              Sign in to publish
            </Link>
          )}
          <Link href="/start/template" className="hidden text-sm font-medium text-accent-text hover:underline md:inline">
            Back
          </Link>
        </>
      }
    >
      {!ready ? (
        <div className="skeleton h-48 rounded-2xl" role="status" aria-label="Loading" />
      ) : (
        <div className="flex flex-col gap-4">
          {missing ? (
            <p role="alert" className="rounded-2xl bg-warning-bg p-4 text-sm text-warning">
              Add your name and email first.{" "}
              <Link href="/start/profile" className="font-medium underline">
                Go to your details
              </Link>
            </p>
          ) : null}

          <div className="rounded-2xl border border-border bg-card p-4 md:p-5">
            <Field
              label="Your portfolio link"
              htmlFor="slug"
              hint={
                slugState.status === "invalid"
                  ? "Use 3–40 lowercase letters, numbers or dashes."
                  : "Short and easy to say works best, like your name."
              }
            >
              {({ id, describedBy }) => (
                <div className="flex items-center rounded-xl border border-input bg-card focus-within:border-primary focus-within:shadow-[inset_0_0_0_1px_var(--primary)]">
                  <span className="shrink-0 pl-4 text-base text-muted-foreground">{siteHost}/p/</span>
                  <input
                    id={id}
                    aria-describedby={describedBy}
                    value={draft.slug}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    onChange={(e) => setDraft((d) => ({ ...d, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))}
                    className="h-12 min-w-0 flex-1 bg-transparent pr-2 text-base outline-none"
                  />
                  <span className="pr-3" aria-live="polite">
                    {slugState.status === "checking" ? (
                      <Loader2 className="size-4 animate-spin text-muted-foreground" aria-label="Checking" />
                    ) : slugState.status === "ok" ? (
                      <CheckCircle2 className="size-5 text-success" aria-label="Available" />
                    ) : slugState.status === "taken" || slugState.status === "invalid" ? (
                      <XCircle className="size-5 text-danger" aria-label="Not available" />
                    ) : null}
                  </span>
                </div>
              )}
            </Field>
            {slugState.status === "taken" && slugState.suggestion ? (
              <p className="mt-2 text-sm text-danger">
                That link is taken.{" "}
                <button
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, slug: slugState.suggestion ?? d.slug }))}
                  className="font-medium text-accent-text underline"
                >
                  Use {slugState.suggestion}
                </button>
              </p>
            ) : null}
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 md:p-5">
            <Field label="Your one-line intro" htmlFor="summary" hint="Shown at the top of your portfolio. Written from your details; edit freely.">
              {({ id, describedBy }) => (
                <TextArea
                  id={id}
                  aria-describedby={describedBy}
                  value={draft.summary || fallbackSummary(draft.profile)}
                  maxLength={600}
                  onChange={(e) => setDraft((d) => ({ ...d, summary: e.target.value, summaryFor: "user-edited" }))}
                />
              )}
            </Field>
            <label className="mt-4 flex min-h-11 cursor-pointer items-center justify-between gap-4">
              <span className="text-sm">
                Show my phone number on my portfolio
                <span className="block text-caption text-muted-foreground">Off by default. Your email is always shown.</span>
              </span>
              <input
                type="checkbox"
                checked={draft.showPhone}
                onChange={(e) => setDraft((d) => ({ ...d, showPhone: e.target.checked }))}
                className="size-5 shrink-0 accent-[var(--primary)]"
              />
            </label>
          </div>

          <ul className="flex flex-col gap-2 rounded-2xl bg-surface p-4 text-sm">
            <li className="flex items-center gap-2">
              <Check className="size-4 text-accent-text" aria-hidden />
              {draft.profile.fullName || "Your name"} · {templateLabel} template
              <Link href="/start/template" className="ml-auto inline-flex min-h-8 items-center gap-1 text-accent-text hover:underline">
                <PencilLine className="size-3.5" aria-hidden />
                Change
              </Link>
            </li>
            <li className="flex items-center gap-2 text-muted-foreground">
              <Globe className="size-4 text-accent-text" aria-hidden />
              Publishing makes this page public. You can unpublish anytime.
            </li>
            <li className="flex items-center gap-2 text-muted-foreground">
              <Lock className="size-4 text-accent-text" aria-hidden />
              Your resume file stays private.
            </li>
          </ul>

          {error ? (
            <p role="alert" className="rounded-2xl bg-danger-bg p-4 text-sm text-danger">
              {error}
            </p>
          ) : null}
        </div>
      )}
    </FlowPage>
  )
}

function Celebration({ url, slug, name }: { url: string; slug: string; name: string }) {
  const shareText = `Here's my portfolio: ${url}`
  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      toast("Link copied")
    } catch {
      toast("Couldn't copy. Press and hold the link to copy it.")
    }
  }
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center px-4 pt-12 pb-16 text-center sm:px-6">
      <span className="animate-pop flex size-20 items-center justify-center rounded-full bg-success-bg text-success">
        <Check className="size-10" strokeWidth={2.5} aria-hidden />
      </span>
      <h1 className="mt-6 text-h1 font-normal md:text-h1-lg">Your portfolio is live</h1>
      <p className="mt-2 text-muted-foreground">
        {name ? `${name.split(" ")[0]}, share` : "Share"} it with recruiters, friends and on your resume.
      </p>

      <div className="mt-6 flex w-full items-center gap-2 rounded-full border border-border bg-card py-1.5 pr-1.5 pl-5">
        <a href={`/p/${slug}`} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 truncate text-left font-mono text-sm text-accent-text hover:underline">
          {url.replace(/^https?:\/\//, "")}
        </a>
        <Button variant="tonal" size="sm" onClick={() => void copy()}>
          <Copy aria-hidden />
          Copy
        </Button>
      </div>

      <div className="mt-3 grid w-full grid-cols-3 gap-2">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ variant: "outline" }), "px-3")}
        >
          <WhatsAppIcon className="size-4" />
          WhatsApp
        </a>
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ variant: "outline" }), "px-3")}
        >
          <LinkedInIcon className="size-4" />
          LinkedIn
        </a>
        <a href={`/p/${slug}`} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ variant: "outline" }), "px-3")}>
          <ExternalLink className="size-4" aria-hidden />
          View
        </a>
      </div>

      <div className="mt-10 w-full rounded-2xl bg-tonal p-5 text-left text-tonal-foreground">
        <p className="text-sm font-medium">Next · about 1 minute</p>
        <p className="mt-1 text-lg">Want to know if it clears a Razorpay screen?</p>
        <p className="mt-1 text-sm opacity-90">
          Get your free score on the 5 things product-company screeners check, and exactly what to fix.
        </p>
        <Link href="/report" className={cn(buttonVariants({ size: "lg" }), "mt-4 w-full sm:w-auto")}>
          See your score
          <ArrowRight aria-hidden />
        </Link>
      </div>
      <Link href="/portfolio" className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-accent-text hover:underline">
        <PencilLine className="size-4" aria-hidden />
        Edit your portfolio
      </Link>
    </div>
  )
}
