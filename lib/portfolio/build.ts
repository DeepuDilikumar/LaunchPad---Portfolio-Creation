import { roleLabel, type Profile, type TargetRole } from "@/lib/profile/types"
import { DEFAULT_SECTION_ORDER, type PortfolioContent, type TemplateKey } from "./types"

/** The template we pre-select, so most students never have to choose. */
export function recommendTemplate(role: TargetRole | ""): TemplateKey {
  if (role === "backend" || role === "fullstack" || role === "devops") return "developer"
  if (role === "frontend" || role === "mobile") return "bold"
  return "minimal"
}

export function headlineFor(profile: Profile): string {
  const role = profile.targetRole ? `${roleLabel(profile.targetRole)} Developer` : "Software Developer"
  const who = profile.gradYear && Number(profile.gradYear) >= new Date().getFullYear() ? `${role} · Class of ${profile.gradYear}` : role
  return who.replace("Data / ML Developer", "Data / ML Engineer").replace("DevOps / Cloud Developer", "DevOps / Cloud Engineer")
}

/**
 * Rule-based one-line intro, used when AI isn't available. Built only from facts the
 * student gave us: no invented claims.
 */
export function fallbackSummary(profile: Profile): string {
  const role = profile.targetRole ? roleLabel(profile.targetRole).toLowerCase() : "software"
  const top = [...profile.skills.languages.slice(0, 2), ...profile.skills.frameworks.slice(0, 2)].filter(Boolean)
  const study = profile.college ? ` at ${profile.college}` : ""
  const year = profile.gradYear ? ` (class of ${profile.gradYear})` : ""
  const skills = top.length ? ` I work mostly with ${listJoin(top)}.` : ""
  const projects = profile.projects.filter((p) => p.title).slice(0, 2).map((p) => p.title)
  const built = projects.length ? ` Recent projects: ${listJoin(projects)}.` : ""
  const intro = profile.college
    ? `Engineering student${study}${year}, focused on ${role} development.`
    : `Developer focused on ${role} development.`
  return `${intro}${skills}${built}`.trim()
}

function listJoin(items: string[]) {
  if (items.length <= 1) return items.join("")
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`
}

export function buildContent(
  profile: Profile,
  template: TemplateKey,
  summary: string,
  showPhone = false
): PortfolioContent {
  return {
    template,
    headline: headlineFor(profile),
    summary: summary || fallbackSummary(profile),
    sectionOrder: [...DEFAULT_SECTION_ORDER],
    hiddenSections: profile.experience.length ? [] : ["experience"],
    showPhone,
    profile,
  }
}
