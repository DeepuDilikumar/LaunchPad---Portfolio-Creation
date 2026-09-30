/** The student's profile, as auto-filled from the resume and confirmed by them. */

export const TARGET_ROLES = [
  { value: "backend", label: "Backend" },
  { value: "frontend", label: "Frontend" },
  { value: "fullstack", label: "Full Stack" },
  { value: "mobile", label: "Mobile" },
  { value: "data", label: "Data / ML" },
  { value: "devops", label: "DevOps / Cloud" },
] as const
export type TargetRole = (typeof TARGET_ROLES)[number]["value"]

export function roleLabel(role: TargetRole | "" | null | undefined): string {
  return TARGET_ROLES.find((r) => r.value === role)?.label ?? "Software"
}

export type Skills = {
  languages: string[]
  frameworks: string[]
  databases: string[]
  tools: string[]
}
export const SKILL_GROUPS: { key: keyof Skills; label: string; placeholder: string }[] = [
  { key: "languages", label: "Languages", placeholder: "e.g. Java, Python" },
  { key: "frameworks", label: "Frameworks & libraries", placeholder: "e.g. Spring Boot, React" },
  { key: "databases", label: "Databases", placeholder: "e.g. MySQL, Redis" },
  { key: "tools", label: "Tools & platforms", placeholder: "e.g. Git, Docker, AWS" },
]

export type ProjectEntry = {
  id: string
  title: string
  description: string
  tech: string[]
  link: string
  bullets: string[]
}

export type ExperienceEntry = {
  id: string
  role: string
  company: string
  period: string
  bullets: string[]
}

export type EducationEntry = {
  id: string
  institution: string
  degree: string
  period: string
  score: string
}

export type Profile = {
  fullName: string
  email: string
  phone: string
  location: string
  college: string
  degree: string
  gradYear: string
  targetRole: TargetRole | ""
  githubUsername: string
  linkedinUrl: string
  skills: Skills
  projects: ProjectEntry[]
  experience: ExperienceEntry[]
  education: EducationEntry[]
}

/** Fields we track for auto-fill provenance ("resume" / "llm" / "user"). */
export const PROFILE_FIELDS = [
  "fullName",
  "email",
  "phone",
  "location",
  "college",
  "degree",
  "gradYear",
  "targetRole",
  "githubUsername",
  "linkedinUrl",
  "skills",
  "projects",
  "experience",
  "education",
] as const satisfies readonly (keyof Profile)[]
export type ProfileField = (typeof PROFILE_FIELDS)[number]

export const FIELD_LABELS: Record<ProfileField, string> = {
  fullName: "Name",
  email: "Email",
  phone: "Phone",
  location: "City",
  college: "College",
  degree: "Degree",
  gradYear: "Graduation year",
  targetRole: "Target role",
  githubUsername: "GitHub",
  linkedinUrl: "LinkedIn",
  skills: "Skills",
  projects: "Projects",
  experience: "Experience",
  education: "Education",
}

export type FieldSource = "resume" | "llm" | "user"
export type FieldSources = Partial<Record<ProfileField, FieldSource>>

export function emptyProfile(): Profile {
  return {
    fullName: "",
    email: "",
    phone: "",
    location: "",
    college: "",
    degree: "",
    gradYear: "",
    targetRole: "",
    githubUsername: "",
    linkedinUrl: "",
    skills: { languages: [], frameworks: [], databases: [], tools: [] },
    projects: [],
    experience: [],
    education: [],
  }
}

export function isFieldFilled(profile: Profile, field: ProfileField): boolean {
  const value = profile[field]
  if (typeof value === "string") return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  return Object.values(value as Skills).some((list) => list.length > 0)
}

export function allSkills(skills: Skills): string[] {
  return [...skills.languages, ...skills.frameworks, ...skills.databases, ...skills.tools]
}

export function newId(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}
