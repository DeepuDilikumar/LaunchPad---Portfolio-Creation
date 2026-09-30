import type { Metadata } from "next"

import { ReportClient } from "@/components/report/report-client"
import { requireUser } from "@/lib/auth/session"
import { getEntitlements, purchasableProducts } from "@/lib/data/entitlements"
import { getProfile } from "@/lib/data/profiles"
import { getLatestResume } from "@/lib/data/resumes"
import { getLatestReport, visibleReport } from "@/lib/diagnostic/service"
import { isDemoMode, isGithubConfigured, isRazorpayConfigured } from "@/lib/env"
import { getGithubConnection } from "@/lib/github/client"

export const metadata: Metadata = { title: "Your profile score", robots: { index: false } }

export default async function ReportPage() {
  const user = await requireUser("/report")
  const [profile, resume, report, ent, github] = await Promise.all([
    getProfile(user.id),
    getLatestResume(user.id),
    getLatestReport(user.id),
    getEntitlements(user.id),
    getGithubConnection(user.id),
  ])
  const hasProfile = Boolean(resume) || Boolean(profile?.data.projects.length)

  return (
    <ReportClient
      initialReport={report ? visibleReport(report, ent) : null}
      hasProfile={hasProfile}
      demo={isDemoMode() && !isRazorpayConfigured()}
      githubConnected={Boolean(github)}
      githubAvailable={isGithubConfigured()}
      purchasable={purchasableProducts(ent)}
    />
  )
}
