import type { CatalogProject } from "@/content/projects"
import type { Profile } from "@/lib/profile/types"
import { roleLabel } from "@/lib/profile/types"

/** Everything the pitch engine may say. Built only from real, completed work. */
export type PitchFacts = {
  name: string
  firstName: string
  role: string
  college: string
  project: { title: string; tagline: string; stack: string[] }
  completedDays: { day: number; title: string; goal: string }[]
  totalDays: number
  commits: number
  repoUrl: string | null
  complete: boolean
}

export function buildFacts(opts: {
  profile: Profile
  project: CatalogProject
  completedDayNumbers: number[]
  commits: number
  repoUrl: string | null
}): PitchFacts {
  const name = opts.profile.fullName.trim() || "I"
  const done = [...opts.completedDayNumbers].sort((a, b) => a - b)
  return {
    name,
    firstName: name.split(" ")[0],
    role: roleLabel(opts.profile.targetRole),
    college: opts.profile.college,
    project: { title: opts.project.title, tagline: opts.project.tagline, stack: opts.project.stack },
    completedDays: done.map((d) => ({ day: d, title: opts.project.days[d - 1].title, goal: opts.project.days[d - 1].goal })),
    totalDays: opts.project.days.length,
    commits: opts.commits,
    repoUrl: opts.repoUrl,
    complete: done.length >= opts.project.days.length,
  }
}
