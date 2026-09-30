import { PROJECTS, type CatalogProject } from "@/content/projects"
import type { Report } from "@/lib/diagnostic/types"
import { allSkills, type Profile } from "@/lib/profile/types"

export type RankedProject = {
  project: CatalogProject
  score: number
  reasons: string[]
  recommended: boolean
}

/**
 * Ranks projects by fit: target role (strongest), overlap with skills they already have
 * (so the 14 days are doable), and how many of their failed rubric checks the project fixes.
 */
export function rankProjects(profile: Profile, report: Report | null): RankedProject[] {
  const have = new Set(allSkills(profile.skills).map((s) => s.toLowerCase()))
  const failed = new Set(
    (report?.pillars ?? []).flatMap((p) => p.checks.filter((c) => !c.met && p.score !== null).map((c) => c.id))
  )

  const ranked = PROJECTS.map((project) => {
    const reasons: string[] = []
    let score = 0
    if (profile.targetRole && project.roles.includes(profile.targetRole)) {
      score += project.roles[0] === profile.targetRole ? 6 : 4
      reasons.push("Fits the role you're aiming for")
    }
    const overlap = project.skills.filter((s) => have.has(s.toLowerCase()))
    score += Math.min(overlap.length, 4) * 1.5
    if (overlap.length) reasons.push(`Builds on what you know: ${overlap.slice(0, 3).join(", ")}`)
    const fixes = project.strengthens.filter((id) => failed.has(id))
    score += Math.min(fixes.length, 6)
    if (fixes.length >= 3) reasons.push(`Fixes ${fixes.length} gaps from your report`)
    return { project, score, reasons, recommended: false }
  }).sort((a, b) => b.score - a.score)

  if (ranked[0]) ranked[0].recommended = true
  return ranked
}
