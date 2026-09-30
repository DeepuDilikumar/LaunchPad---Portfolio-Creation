"use client"

import { AlertCircle, Check, ChevronDown, FlaskConical, Loader2, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { GitHubIcon } from "@/components/icons/brand"
import { Button, buttonVariants } from "@/components/ui/button"
import { Field, TextInput } from "@/components/ui/field"
import { cn } from "@/lib/utils"

export type PickerProject = {
  key: string
  title: string
  tagline: string
  difficulty: string
  stack: string[]
  interviewTopics: string[]
  jdMapping: { company: string; asks: string }[]
  reasons: string[]
  recommended: boolean
  firstDays: string[]
}

export function ProjectPicker({
  projects,
  githubLogin,
  githubConfigured,
  demo,
  githubStatus,
}: {
  projects: PickerProject[]
  githubLogin: string | null
  githubConfigured: boolean
  demo: boolean
  githubStatus: string | null
}) {
  const router = useRouter()
  const [selected, setSelected] = useState(projects[0]?.key ?? "")
  const [repoName, setRepoName] = useState(projects[0]?.key ?? "")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const project = projects.find((p) => p.key === selected)

  async function start(withoutGithub = false) {
    setBusy(true)
    setError(null)
    try {
      const r = await fetch("/api/program/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ projectKey: selected, repoName, withoutGithub }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data?.error?.message ?? "Couldn't start. Please try again.")
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't start. Please try again.")
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pt-6 sm:px-6 md:pt-10">
      <h1 className="text-h1 font-normal md:text-h1-lg">Pick your project</h1>
      <p className="mt-2 text-muted-foreground">Ranked for your target role, your skills and the gaps in your report. The top one is our pick for you.</p>

      <fieldset className="mt-6 flex flex-col gap-3">
        <legend className="sr-only">Projects</legend>
        {projects.map((p) => {
          const active = p.key === selected
          return (
            <div key={p.key} className={cn("rounded-2xl border bg-card", active ? "border-2 border-primary" : "border-border")}>
              <label className="flex cursor-pointer gap-3 p-4 has-focus-visible:outline-2 has-focus-visible:outline-ring">
                <input
                  type="radio"
                  name="project"
                  value={p.key}
                  checked={active}
                  onChange={() => {
                    setSelected(p.key)
                    setRepoName(p.key)
                  }}
                  className="mt-1 size-5 shrink-0 accent-[var(--primary)]"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-medium">{p.title}</span>
                    {p.recommended ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-tonal px-2 py-0.5 text-caption font-medium text-tonal-foreground">
                        <Sparkles className="size-3" aria-hidden />
                        Best fit for you
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">{p.tagline}</span>
                  <span className="mt-2 flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-caption">{p.difficulty}</span>
                    {p.stack.slice(0, 5).map((s) => (
                      <span key={s} className="rounded-full border border-border px-2 py-0.5 text-caption">
                        {s}
                      </span>
                    ))}
                  </span>
                  {p.reasons.length ? (
                    <span className="mt-2 flex flex-col gap-0.5 text-caption text-accent-text">
                      {p.reasons.map((r) => (
                        <span key={r} className="inline-flex items-center gap-1">
                          <Check className="size-3" aria-hidden />
                          {r}
                        </span>
                      ))}
                    </span>
                  ) : null}
                </span>
              </label>
              <details className="group border-t border-border">
                <summary className="flex min-h-11 list-none items-center justify-between px-4 text-sm font-medium text-accent-text [&::-webkit-details-marker]:hidden">
                  What you&apos;ll build and be asked
                  <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden />
                </summary>
                <div className="grid gap-4 px-4 pb-4 text-sm md:grid-cols-2">
                  <div>
                    <p className="font-medium">Interviewers will ask</p>
                    <ul className="mt-1 flex list-disc flex-col gap-1 pl-5 text-muted-foreground">
                      {p.interviewTopics.map((q) => (
                        <li key={q}>{q}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium">Where it shows up in job descriptions</p>
                    <ul className="mt-1 flex flex-col gap-1 text-muted-foreground">
                      {p.jdMapping.map((j) => (
                        <li key={j.company}>
                          <span className="text-foreground">{j.company}:</span> {j.asks}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-1 text-caption text-muted-foreground">Typical asks in SDE-1 postings, not quotes from a specific job.</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="font-medium">Your first days</p>
                    <ol className="mt-1 flex list-decimal flex-col gap-0.5 pl-5 text-muted-foreground">
                      {p.firstDays.map((d) => (
                        <li key={d}>{d}</li>
                      ))}
                    </ol>
                  </div>
                </div>
              </details>
            </div>
          )
        })}
      </fieldset>

      <section className="mt-8 rounded-2xl bg-surface p-5" aria-labelledby="create-repo">
        <h2 id="create-repo" className="text-h3 font-medium">
          Create your repo
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          We create a public repo in your GitHub with one starter commit, clearly labelled as generated by LaunchPad. Every commit after that
          is yours.
        </p>

        {githubStatus === "cancelled" || githubStatus === "failed" ? (
          <p role="alert" className="mt-3 flex items-center gap-2 rounded-xl bg-danger-bg p-3 text-sm text-danger">
            <AlertCircle className="size-4" aria-hidden />
            GitHub didn&apos;t connect. Please try again.
          </p>
        ) : null}

        {githubLogin ? (
          <div className="mt-4 flex flex-col gap-4">
            <p className="inline-flex items-center gap-2 text-sm">
              <GitHubIcon className="size-4" />
              Connected as <span className="font-medium">{githubLogin}</span>
            </p>
            <Field label="Repository name" htmlFor="repo-name" hint={`github.com/${githubLogin}/${repoName || "…"}`}>
              {({ id, describedBy }) => (
                <TextInput id={id} aria-describedby={describedBy} value={repoName} onChange={(e) => setRepoName(e.target.value)} />
              )}
            </Field>
            <Button size="lg" loading={busy} onClick={() => void start()} className="w-full sm:w-auto">
              {busy ? "Creating your repo" : `Start ${project?.title ?? "project"}`}
            </Button>
          </div>
        ) : githubConfigured ? (
          <a
            href={`/api/github/connect?next=${encodeURIComponent("/program")}`}
            className={cn(buttonVariants({ size: "lg" }), "mt-4 w-full sm:w-auto")}
          >
            <GitHubIcon className="size-5" />
            Connect GitHub
          </a>
        ) : demo ? (
          <div className="mt-4 flex flex-col gap-2">
            <Button size="lg" loading={busy} onClick={() => void start(true)} className="w-full sm:w-auto">
              Start without GitHub (demo)
            </Button>
            <p className="flex items-center gap-1.5 text-caption text-muted-foreground">
              <FlaskConical className="size-3.5" aria-hidden />
              Demo mode: GitHub isn&apos;t connected on this server, so days are marked done without checking commits.
            </p>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">GitHub connection isn&apos;t available right now. Please try again later.</p>
        )}

        {busy ? (
          <p className="mt-3 inline-flex items-center gap-2 text-sm text-muted-foreground" role="status">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Creating the repo and adding the starter files (1 commit)
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="mt-3 rounded-xl bg-danger-bg p-3 text-sm text-danger">
            {error}
          </p>
        ) : null}
      </section>
    </div>
  )
}
