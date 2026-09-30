import type { Profile } from "@/lib/profile/types"

export const TEMPLATES = [
  { key: "minimal", label: "Minimal", description: "Clean and calm. Lets your projects speak." },
  { key: "developer", label: "Developer", description: "Code-flavoured, great for backend and full-stack roles." },
  { key: "bold", label: "Bold", description: "A strong colour header that stands out on phones." },
] as const
export type TemplateKey = (typeof TEMPLATES)[number]["key"]

export const SECTIONS = [
  { key: "about", label: "About" },
  { key: "skills", label: "Skills" },
  { key: "projects", label: "Projects" },
  { key: "experience", label: "Experience" },
  { key: "education", label: "Education" },
  { key: "contact", label: "Contact" },
] as const
export type SectionKey = (typeof SECTIONS)[number]["key"]

export const DEFAULT_SECTION_ORDER: SectionKey[] = SECTIONS.map((s) => s.key)

export type PortfolioContent = {
  template: TemplateKey
  headline: string
  summary: string
  sectionOrder: SectionKey[]
  hiddenSections: SectionKey[]
  /** Phone numbers are private by default; shown only if the student opts in. */
  showPhone: boolean
  profile: Profile
}

/** Progress of the LaunchPad-built project, shown with a "Built in 14 days" badge. */
export type ProgramBadge = {
  title: string
  repoUrl: string | null
  daysDone: number
  totalDays: number
  complete: boolean
  stack: string[]
}

export function isTemplateKey(value: unknown): value is TemplateKey {
  return TEMPLATES.some((t) => t.key === value)
}
