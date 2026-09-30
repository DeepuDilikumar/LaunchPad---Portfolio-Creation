import { roleLabel, type Profile } from "@/lib/profile/types"

/** One bullet in the rewrite workflow. */
export type RewriteBullet = {
  id: string
  section: "project" | "experience"
  /** Project title or "Role · Company". */
  parent: string
  parentId: string
  original: string
  suggested: string
  final: string
  status: "pending" | "accepted" | "edited" | "rejected"
}

export const PLACEHOLDER = /\[[^\]]{1,40}\]/g

export function hasPlaceholder(text: string) {
  return new RegExp(PLACEHOLDER.source).test(text)
}

/** Text that ends up on the resume for a bullet. */
export function chosenText(b: RewriteBullet): string {
  if (b.status === "accepted") return b.suggested
  if (b.status === "edited") return b.final
  return b.original
}

/** Collects every bullet on the resume, in order, with a stable id. */
export function collectBullets(profile: Profile): Omit<RewriteBullet, "suggested" | "final" | "status">[] {
  const out: Omit<RewriteBullet, "suggested" | "final" | "status">[] = []
  for (const p of profile.projects.filter((x) => x.title.trim())) {
    const lines = p.bullets.filter((b) => b.trim()).length ? p.bullets : p.description ? [p.description] : []
    lines.filter((l) => l.trim()).forEach((line, i) =>
      out.push({ id: `${p.id}:${i}`, section: "project", parent: p.title, parentId: p.id, original: line.trim() })
    )
  }
  for (const e of profile.experience.filter((x) => x.role || x.company)) {
    e.bullets
      .filter((b) => b.trim())
      .forEach((line, i) =>
        out.push({
          id: `${e.id}:${i}`,
          section: "experience",
          parent: [e.role, e.company].filter(Boolean).join(" · "),
          parentId: e.id,
          original: line.trim(),
        })
      )
  }
  return out
}

export type ResumeDocument = {
  name: string
  headline: string
  contact: string[]
  education: { institution: string; detail: string; period: string }[]
  skills: { label: string; items: string }[]
  projects: { title: string; tech: string; link: string; bullets: string[] }[]
  experience: { role: string; company: string; period: string; bullets: string[] }[]
}

/** The single-column, ATS-safe resume built from the profile and the chosen bullets. */
export function buildResumeDocument(profile: Profile, bullets: RewriteBullet[]): ResumeDocument {
  // Rewritten bullets when they exist; otherwise the student's own bullets, unchanged.
  const byParent = (id: string, own: string[]) => {
    const rewritten = bullets.filter((b) => b.parentId === id).map(chosenText).filter(Boolean)
    return rewritten.length ? rewritten : own.map((b) => b.trim()).filter(Boolean)
  }
  const edu = profile.education.length
    ? profile.education.map((e) => ({
        institution: e.institution || profile.college,
        detail: [e.degree || profile.degree, e.score].filter(Boolean).join(" · "),
        period: e.period || profile.gradYear,
      }))
    : profile.college
      ? [{ institution: profile.college, detail: profile.degree, period: profile.gradYear ? `Expected ${profile.gradYear}` : "" }]
      : []
  const skills = [
    { label: "Languages", items: profile.skills.languages.join(", ") },
    { label: "Frameworks", items: profile.skills.frameworks.join(", ") },
    { label: "Databases", items: profile.skills.databases.join(", ") },
    { label: "Tools", items: profile.skills.tools.join(", ") },
  ].filter((s) => s.items)

  return {
    name: profile.fullName,
    headline: profile.targetRole ? `${roleLabel(profile.targetRole)} Developer` : "",
    contact: [
      profile.email,
      profile.phone,
      profile.location,
      profile.githubUsername && `github.com/${profile.githubUsername}`,
      profile.linkedinUrl && profile.linkedinUrl.replace(/^https?:\/\/(www\.)?/, ""),
    ].filter(Boolean) as string[],
    education: edu,
    skills,
    projects: profile.projects
      .filter((p) => p.title.trim())
      .map((p) => ({
        title: p.title,
        tech: p.tech.join(", "),
        link: p.link.replace(/^https?:\/\/(www\.)?/, ""),
        bullets: byParent(p.id, p.bullets.length ? p.bullets : p.description ? [p.description] : []),
      })),
    experience: profile.experience
      .filter((e) => e.role || e.company)
      .map((e) => ({ role: e.role, company: e.company, period: e.period, bullets: byParent(e.id, e.bullets) })),
  }
}
