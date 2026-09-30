import { ArrowLeft, Megaphone } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { PitchStudio } from "@/components/pitch/pitch-studio"
import { StatePanel } from "@/components/shared/state-panel"
import { buttonVariants } from "@/components/ui/button"
import { requireUser } from "@/lib/auth/session"
import { getEntitlements } from "@/lib/data/entitlements"
import { isLLMConfigured } from "@/lib/env"
import { getDrafts } from "@/lib/pitch/service"
import { getProgramSummary } from "@/lib/program/service"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { title: "Announce your project", robots: { index: false } }

export default async function AnnouncePage() {
  const user = await requireUser("/program/announce")
  const [ent, summary] = await Promise.all([getEntitlements(user.id), getProgramSummary(user.id)])
  if (!ent.program || !summary) redirect("/program")
  const drafts = await getDrafts(user.id)

  return (
    <div className="mx-auto max-w-2xl px-4 pt-6 sm:px-6 md:pt-10">
      <Link href="/program" className="inline-flex min-h-11 items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden />
        Program
      </Link>
      <h1 className="mt-1 text-h1 font-normal">Announce it</h1>
      <p className="mt-1 text-muted-foreground">
        Ready-to-use words about {summary.project.title}, written from the {summary.daysDone} day{summary.daysDone === 1 ? "" : "s"} you&apos;ve
        actually completed.
      </p>
      <div className="mt-6">
        {summary.daysDone === 0 ? (
          <StatePanel
            icon={Megaphone}
            headingLevel="h2"
            title="Finish Day 1 first"
            action={
              <Link href={`/program/day/${summary.currentDay}`} className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}>
                Go to today&apos;s task
              </Link>
            }
          >
            <p>We only write about work you&apos;ve really done, so there&apos;s nothing to announce yet.</p>
          </StatePanel>
        ) : (
          <PitchStudio
            initial={Object.fromEntries(drafts.map((d) => [`${d.kind}:${d.tone}`, { content: d.content, source: d.source }]))}
            aiEnabled={isLLMConfigured()}
          />
        )}
      </div>
    </div>
  )
}
