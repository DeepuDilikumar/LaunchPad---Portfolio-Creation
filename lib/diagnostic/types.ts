import type { PillarKey } from "@/lib/prompts/diagnostic"

export type CheckResult = {
  id: string
  label: string
  weight: number
  met: boolean
  evidence: string
}

export type PillarStatus = "passing" | "needs_work" | "critical" | "not_assessed"

export type PillarResult = {
  key: PillarKey
  title: string
  short: string
  status: PillarStatus
  /** null when not assessed. */
  score: number | null
  notices: string[]
  fixes: string[]
  checks: CheckResult[]
}

export type Report = {
  rubricVersion: string
  target: number
  overall: number
  source: "ai" | "rules"
  createdAt: string
  pillars: PillarResult[]
}

/** What a user without the paid report can see for a locked pillar. */
export type LockedPillar = Pick<PillarResult, "key" | "title" | "short" | "status"> & { locked: true }
export type VisibleReport = Omit<Report, "pillars"> & {
  pillars: (PillarResult | LockedPillar)[]
  unlocked: boolean
}

export type GithubSignal = {
  login: string
  activeWeeks: number // of the last 12
  reposWithReadme: number
  topRepos: number
  originalDescribedRepos: number
  descriptiveCommitRatio: number // 0..1
}

export type DiagnosticInput = {
  profileJson: string
  profile: import("@/lib/profile/types").Profile
  resumeText: string
  layout: "single-column" | "two-column" | "unknown"
  hasTables: boolean
  github: GithubSignal | null
}
