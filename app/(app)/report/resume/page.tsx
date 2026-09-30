import { ArrowLeft, Lock } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { ResumeRewriter } from "@/components/resume/resume-rewriter"
import { StatePanel } from "@/components/shared/state-panel"
import { buttonVariants } from "@/components/ui/button"
import { requireUser } from "@/lib/auth/session"
import { getEntitlements } from "@/lib/data/entitlements"
import { getProfile } from "@/lib/data/profiles"
import { getRewrite } from "@/lib/resume/rewrite-service"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { title: "Fix my resume", robots: { index: false } }

export default async function ResumeRewritePage() {
  const user = await requireUser("/report/resume")
  const [ent, profile, rewrite] = await Promise.all([getEntitlements(user.id), getProfile(user.id), getRewrite(user.id)])

  if (!ent.report) {
    return (
      <div className="px-4 py-16">
        <StatePanel
          icon={Lock}
          title="The resume rewrite comes with your full report"
          action={
            <Link href="/report" className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}>
              <ArrowLeft aria-hidden />
              Back to my score
            </Link>
          }
        >
          <p>Unlock the full report to get stronger, ATS-friendly bullets and a PDF + LaTeX resume.</p>
        </StatePanel>
      </div>
    )
  }
  if (!profile) {
    return (
      <div className="px-4 py-16">
        <StatePanel
          icon={ArrowLeft}
          title="Add your details first"
          action={
            <Link href="/start" className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}>
              Upload resume
            </Link>
          }
        />
      </div>
    )
  }
  return <ResumeRewriter profile={profile.data} initialBullets={rewrite?.bullets ?? null} initialSource={rewrite?.source ?? null} />
}
