/**
 * Tier 1 auto-fill: an instant, on-device heuristic parser. No network, no AI.
 * Turns plain resume text into a Profile. Tier 2 (the server LLM) may refine it later,
 * but only for fields the student hasn't edited.
 */
import {
  PROFILE_FIELDS,
  emptyProfile,
  isFieldFilled,
  newId,
  type EducationEntry,
  type ExperienceEntry,
  type Profile,
  type ProfileField,
  type ProjectEntry,
  type Skills,
  type TargetRole,
} from "@/lib/profile/types"
import { AMBIGUOUS_SKILLS, SKILL_DICTIONARY } from "./skills-dictionary"

type SectionKey =
  | "header"
  | "summary"
  | "education"
  | "projects"
  | "experience"
  | "skills"
  | "certifications"
  | "achievements"
  | "other"

const SECTION_PATTERNS: [SectionKey, RegExp][] = [
  ["summary", /^(professional\s+)?(summary|objective|career objective|profile|about( me)?)$/],
  ["education", /^(education|academics?|academic (details|background|qualifications?)|qualifications?)$/],
  ["projects", /^((academic|personal|key|major|technical|selected)\s+)?projects?( undertaken)?$/],
  ["experience", /^((work|professional|industry|relevant)\s+)?(experience|internships?|employment( history)?)$|^internship experience$/],
  ["skills", /^((technical|key|core)\s+)?(skills|technologies|tech stack|skill set|technical proficiency)( & tools)?$/],
  ["certifications", /^(certifications?|courses|certificates|online courses)$/],
  ["achievements", /^(achievements?|awards?|honou?rs|accomplishments)( (and|&) awards?)?$/],
  ["other", /^(extra[- ]?curricular( activities)?|positions? of responsibility|hobbies|interests|languages( known)?|declaration|personal (details|information)|publications|volunteering|coursework|relevant coursework|leadership)$/],
]

const BULLET = /^\s*(?:[•●▪◦‣∙·*➢➤►–—-]|\d+[.)])\s+/
const MONTH = "(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)"
const DATE_RANGE = new RegExp(
  `(${MONTH}\\.?\\s*'?\\d{2,4}|\\d{1,2}/\\d{4}|\\b(?:19|20)\\d{2})\\s*(?:-|–|—|to)\\s*(${MONTH}\\.?\\s*'?\\d{2,4}|\\d{1,2}/\\d{4}|\\b(?:19|20)\\d{2}|present|current|now|ongoing|till date)`,
  "i"
)

const CITIES = [
  "Bengaluru", "Bangalore", "Hyderabad", "Chennai", "Pune", "Mumbai", "New Delhi", "Delhi", "Noida",
  "Gurugram", "Gurgaon", "Kolkata", "Kochi", "Coimbatore", "Jaipur", "Ahmedabad", "Indore", "Bhopal",
  "Lucknow", "Chandigarh", "Nagpur", "Visakhapatnam", "Vijayawada", "Thiruvananthapuram", "Trivandrum",
  "Mysuru", "Mysore", "Mangaluru", "Mangalore", "Madurai", "Bhubaneswar", "Patna", "Ranchi", "Guwahati",
  "Dehradun", "Surat", "Vadodara", "Nashik", "Warangal", "Tiruchirappalli", "Trichy", "Kanpur", "Varanasi",
]

const COLLEGE_HINT = /\b(university|college|institute|institution|iit|nit|iiit|bits|vidyapeeth|vidyalaya|polytechnic|school of engineering|academy of|engineering)\b/i
const DEGREE_HINT = /\b(b\.?\s?tech|b\.?\s?e\.?|m\.?\s?tech|m\.?\s?e\.?|mca|bca|b\.?\s?sc|m\.?\s?sc|bachelor[’']?s?( of [a-z &]+)?|master[’']?s?( of [a-z &]+)?|b\.?\s?com|diploma)\b/i

function normalise(text: string): string[] {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/ /g, " ")
    .replace(/[ \t]+/g, " ")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
}

function headingKey(line: string): SectionKey | null {
  if (line.length > 48 || BULLET.test(line)) return null
  const clean = line.replace(/[:|_•\-–—]+$/g, "").replace(/^[\s#*]+/, "").trim().toLowerCase()
  for (const [key, pattern] of SECTION_PATTERNS) if (pattern.test(clean)) return key
  return null
}

function splitSections(lines: string[]) {
  const sections: Record<SectionKey, string[]> = {
    header: [], summary: [], education: [], projects: [], experience: [], skills: [],
    certifications: [], achievements: [], other: [],
  }
  let current: SectionKey = "header"
  for (const line of lines) {
    const key = headingKey(line)
    if (key) {
      current = key
      continue
    }
    sections[current].push(line)
  }
  return sections
}

function titleCase(value: string) {
  return value.toLowerCase().replace(/\b([a-z])/g, (m) => m.toUpperCase())
}

function extractEmail(text: string) {
  return text.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i)?.[0] ?? ""
}

function extractPhone(text: string) {
  // Indian mobile numbers in any common grouping: 98470 12345, 984-701-2345, +91-9847012345.
  const candidates = text.match(/(?:\+?91[\s-]?)?(?:\d[\s-]?){9}\d/g) ?? []
  for (const candidate of candidates) {
    const digits = candidate.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "")
    if (/^[6-9]\d{9}$/.test(digits)) return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`
  }
  return ""
}

function extractGithub(text: string) {
  const m = text.match(/github\.com\/([a-z0-9](?:[a-z0-9-]{0,38}))(?![a-z0-9-])/i)
  return m ? m[1] : ""
}

function extractLinkedin(text: string) {
  const m = text.match(/linkedin\.com\/in\/([a-z0-9-_%]+)/i)
  return m ? `https://www.linkedin.com/in/${m[1].replace(/\/$/, "")}` : ""
}

function looksLikeName(line: string) {
  const cleaned = line
    .replace(/\b(resume|curriculum vitae|cv|biodata)\b/gi, "")
    .replace(/[|•,–—-]+.*$/, "")
    .trim()
  if (!cleaned || /[@\d/]/.test(cleaned) || /https?:|www\./i.test(cleaned)) return ""
  const words = cleaned.split(/\s+/)
  if (words.length < 1 || words.length > 5) return ""
  if (!words.every((w) => /^[A-Za-z][A-Za-z.'’-]*$/.test(w))) return ""
  if (words.length === 1 && cleaned.length < 3) return ""
  if (headingKey(cleaned)) return ""
  return cleaned === cleaned.toUpperCase() ? titleCase(cleaned) : cleaned
}

function extractName(header: string[], all: string[]) {
  for (const line of [...header.slice(0, 6), ...all.slice(0, 3)]) {
    // A header line can hold "NAME | email | phone"; try the first segment.
    const candidate = looksLikeName(line.split(/\s[|•·]\s|\s{2,}/)[0])
    if (candidate) return candidate
  }
  return ""
}

function extractLocation(header: string[]) {
  const text = header.slice(0, 8).join(" ")
  const city = CITIES.find((c) => new RegExp(`\\b${c}\\b`, "i").test(text))
  if (!city) return ""
  if (city === "Bangalore") return "Bengaluru"
  if (city === "Gurgaon") return "Gurugram"
  if (city === "Trivandrum") return "Thiruvananthapuram"
  return city
}

function yearsIn(text: string) {
  return (text.match(/\b(19[89]\d|20\d{2})\b/g) ?? []).map(Number)
}

function extractEducation(lines: string[], fullText: string) {
  const pool = lines.length ? lines : normalise(fullText)
  const collegeCandidates = pool.filter(
    (l) =>
      COLLEGE_HINT.test(l) &&
      !/\b(school|class|x|xii|hsc|ssc|cbse|icse|state board)\b/i.test(l.replace(/school of engineering/i, ""))
  )
  // Prefer a line that names an institution over a degree line like "Bachelor of Engineering".
  const collegeLine =
    collegeCandidates.find((l) => !DEGREE_HINT.test(l)) ?? collegeCandidates[0] ?? ""
  const college = collegeLine
    .replace(DATE_RANGE, "")
    .replace(/\b(19|20)\d{2}\b/g, "")
    .replace(/\b(cgpa|gpa|sgpa|percentage)\b.*$/i, "")
    .replace(/\b\d{1,3}(?:\.\d+)?\s*%/g, "")
    .replace(/\s{2,}/g, " ")
    .trim()
    .replace(/[|,–—-]\s*$/, "")
    .split(/\s[|–—]\s/)[0]
    .trim()
  const degreeLine = pool.find((l) => DEGREE_HINT.test(l)) ?? ""
  const degree = degreeLine
    ? degreeLine.replace(DATE_RANGE, "").replace(/\b(19|20)\d{2}\b/g, "").split(/\s[|–—]\s|,\s(?=[A-Z])/)[0].replace(/[\s,;:|–—-]+$/, "").trim().slice(0, 80)
    : ""

  const now = new Date().getFullYear()
  const scopeText = (lines.length ? lines : pool.filter((l) => COLLEGE_HINT.test(l) || DEGREE_HINT.test(l))).join(" ")
  const expected = scopeText.match(/(?:expected|graduat\w*|batch|class of|passing)[^0-9]{0,20}((?:19|20)\d{2})/i)
  const years = yearsIn(scopeText).filter((y) => y <= now + 5)
  const gradYear = expected ? expected[1] : years.length ? String(Math.max(...years)) : ""

  const scoreMatch = scopeText.match(/(?:cgpa|gpa|sgpa)\s*[:\-]?\s*(\d{1,2}(?:\.\d{1,2})?)\s*(?:\/\s*10)?|(\d{2}(?:\.\d{1,2})?)\s*%/i)
  const score = scoreMatch ? (scoreMatch[1] ? `${scoreMatch[1]} CGPA` : `${scoreMatch[2]}%`) : ""
  const range = scopeText.match(DATE_RANGE)

  const education: EducationEntry[] = college || degree
    ? [{ id: newId("edu"), institution: college, degree, period: range ? range[0] : gradYear, score }]
    : []
  return { college, degree, gradYear, education }
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function aliasPattern(alias: string) {
  // Aliases may already contain regex escapes (e.g. "c\\+\\+"); plain ones get escaped.
  const body = /\\/.test(alias) ? alias : escapeRegex(alias)
  return new RegExp(`(^|[^a-z0-9+#.])${body}(?![a-z0-9+#])`, "i")
}

function extractSkills(skillLines: string[], contextLines: string[]): Skills {
  const skills: Skills = { languages: [], frameworks: [], databases: [], tools: [] }
  const strict = skillLines.join(" \n ")
  const loose = contextLines.join(" \n ")
  for (const group of Object.keys(SKILL_DICTIONARY) as (keyof Skills)[]) {
    const found: { name: string; index: number }[] = []
    for (const [display, ...aliases] of SKILL_DICTIONARY[group]) {
      const names = [display, ...aliases]
      const haystacks = AMBIGUOUS_SKILLS.has(display) ? [strict] : [strict, loose]
      let index = -1
      for (const hay of haystacks) {
        for (const name of names) {
          const m = aliasPattern(name).exec(hay)
          if (m && (index === -1 || m.index < index)) index = m.index
        }
        if (index !== -1) break
      }
      if (index !== -1) found.push({ name: display, index })
    }
    // "C" should not be inferred from "C++"/"C#" alone.
    skills[group] = found.sort((a, b) => a.index - b.index).map((f) => f.name)
  }
  if (skills.frameworks.includes("Spring Boot")) skills.frameworks = skills.frameworks.filter((f) => f !== "Spring")
  if (skills.frameworks.includes("React Native") && !/\breact(\.js|js)?\b(?!\s*native)/i.test(strict + loose)) {
    skills.frameworks = skills.frameworks.filter((f) => f !== "React")
  }
  return skills
}

function splitTitleAndTech(line: string) {
  const parts = line.split(/\s*(?:\||–|—|:|\s-\s)\s*/)
  const title = parts[0].replace(DATE_RANGE, "").replace(/\((?:[^)]*)\)\s*$/, "").trim()
  const techPart = parts.slice(1).join(", ").replace(DATE_RANGE, "")
  const tech = techPart
    .split(/,|\/|\band\b/)
    .map((t) => t.replace(/^(tech(nologies)?( stack)?|built with|stack|tools)\s*/i, "").trim())
    .filter((t) => t.length > 0 && t.length < 30 && !/github|link|live|demo/i.test(t))
  return { title, tech }
}

function isEntryHeader(line: string, next: string | undefined) {
  if (BULLET.test(line)) return false
  if (line.length > 110) return false
  if (/^(tech(nologies)?( stack)?|tools|stack|built with)\s*[:\-]/i.test(line)) return false
  if (/[.!?]$/.test(line) && line.split(" ").length > 12) return false
  return next === undefined || BULLET.test(next) || DATE_RANGE.test(line) || /\||–|—/.test(line) || line.split(" ").length <= 8
}

function extractProjects(lines: string[]): ProjectEntry[] {
  const projects: ProjectEntry[] = []
  let current: ProjectEntry | null = null
  lines.forEach((line, i) => {
    const link = line.match(/(https?:\/\/)?(github\.com|gitlab\.com|[a-z0-9-]+\.(vercel|netlify)\.app)\/?[^\s)]*/i)?.[0]
    const techLine = line.match(/^(tech(nologies)?( stack)?|tools|stack|built with)\s*[:\-]\s*(.+)$/i)
    if (techLine && current) {
      current.tech = techLine[4].split(/,|\//).map((t) => t.trim()).filter(Boolean).slice(0, 10)
      return
    }
    if (isEntryHeader(line, lines[i + 1]) && !(current && current.bullets.length === 0 && !BULLET.test(lines[i + 1] ?? "") && line.split(" ").length > 8)) {
      const { title, tech } = splitTitleAndTech(line)
      if (title.length >= 3 && !/^https?:/i.test(title)) {
        current = { id: newId("proj"), title: title.slice(0, 80), description: "", tech, link: "", bullets: [] }
        projects.push(current)
        if (link) current.link = link.startsWith("http") ? link : `https://${link}`
        return
      }
    }
    if (!current) return
    if (link && !current.link) current.link = link.startsWith("http") ? link : `https://${link}`
    const text = line.replace(BULLET, "").trim()
    if (!text || (link && text.replace(link, "").trim().length < 4)) return
    current.bullets.push(text)
  })
  for (const p of projects) {
    p.description = p.bullets[0] ?? ""
  }
  return projects.filter((p) => p.title && (p.bullets.length > 0 || p.tech.length > 0)).slice(0, 8)
}

function extractExperience(lines: string[]): ExperienceEntry[] {
  const entries: ExperienceEntry[] = []
  let current: ExperienceEntry | null = null
  lines.forEach((line, i) => {
    if (isEntryHeader(line, lines[i + 1])) {
      const period = line.match(DATE_RANGE)?.[0] ?? ""
      const rest = line
        .replace(DATE_RANGE, "")
        .replace(/\(\s*\)|\[\s*\]/g, "") // brackets left empty once the dates are taken out
        .replace(/[|,–—-]\s*$/, "")
        .trim()
      const at = rest.split(/\s+at\s+|\s*[|–—@]\s*|,\s+/)
      const roleFirst = /(intern|engineer|developer|analyst|trainee|associate|lead|member|consultant|designer)/i.test(at[0] ?? "")
      const role = (roleFirst ? at[0] : at[1] ?? "") ?? ""
      const company = (roleFirst ? at[1] : at[0]) ?? ""
      if (current && !period && current.bullets.length === 0 && !current.period && rest) {
        // Two-line header: "Company" then "Role · dates"
        current.role = current.role || rest
        return
      }
      current = { id: newId("exp"), role: role.trim(), company: company.trim(), period, bullets: [] }
      entries.push(current)
      return
    }
    if (!current) return
    const text = line.replace(BULLET, "").trim()
    if (text) current.bullets.push(text)
  })
  return entries.filter((e) => e.role || e.company).slice(0, 6)
}

const ROLE_KEYWORDS: [TargetRole, RegExp][] = [
  ["fullstack", /\bfull[\s-]?stack\b|\bmern\b|\bmean stack\b/i],
  ["backend", /\bback[\s-]?end\b|\bserver[\s-]side\b|\bapi developer\b/i],
  ["frontend", /\bfront[\s-]?end\b|\bui developer\b|\bweb developer\b/i],
  ["mobile", /\b(android|ios|mobile|flutter|react native) (developer|engineer|app developer)\b/i],
  ["data", /\b(data scien\w*|machine learning|ml engineer|data analyst|ai engineer|deep learning|data engineer)\b/i],
  ["devops", /\b(devops|site reliability|sre|cloud engineer)\b/i],
]

function inferTargetRole(focusText: string, skills: Skills): TargetRole | "" {
  let best: { role: TargetRole; index: number } | null = null
  for (const [role, pattern] of ROLE_KEYWORDS) {
    const m = pattern.exec(focusText)
    if (m && (!best || m.index < best.index)) best = { role, index: m.index }
  }
  if (best) return best.role
  const all = new Set([...skills.frameworks, ...skills.tools, ...skills.languages])
  const has = (...names: string[]) => names.some((n) => all.has(n))
  if (has("TensorFlow", "PyTorch", "scikit-learn", "Pandas")) return "data"
  if (has("Flutter", "React Native", "Android SDK", "Jetpack Compose", "Swift", "Kotlin") && !has("Spring Boot")) return "mobile"
  const front = has("React", "Next.js", "Angular", "Vue")
  const back = has("Spring Boot", "Django", "Flask", "FastAPI", "Express", "NestJS", "Node.js", ".NET")
  if (front && back) return "fullstack"
  if (back) return "backend"
  if (front) return "frontend"
  return ""
}

export type ParsedResume = {
  profile: Profile
  /** Fields the parser filled, for the "We filled N fields" banner. */
  filled: ProfileField[]
}

export function extractResumeProfile(text: string): ParsedResume {
  const lines = normalise(text)
  const sections = splitSections(lines)
  const fullText = lines.join("\n")
  const headerText = sections.header.join("\n")

  const profile = emptyProfile()
  profile.email = extractEmail(headerText) || extractEmail(fullText)
  profile.phone = extractPhone(headerText) || extractPhone(fullText)
  profile.githubUsername = extractGithub(headerText) || extractGithub(fullText)
  profile.linkedinUrl = extractLinkedin(fullText)
  profile.fullName = extractName(sections.header, lines)
  profile.location = extractLocation(sections.header)

  const edu = extractEducation(sections.education, fullText)
  profile.college = edu.college
  profile.degree = edu.degree
  profile.gradYear = edu.gradYear
  profile.education = edu.education

  const projectTech = sections.projects.filter((l) => /tech|stack|built with|\|/i.test(l))
  profile.skills = extractSkills(
    [...sections.skills, ...projectTech],
    sections.skills.length ? [...sections.projects, ...sections.experience] : lines
  )
  profile.projects = extractProjects(sections.projects)
  profile.experience = extractExperience(sections.experience)
  profile.targetRole = inferTargetRole(
    [...sections.header.slice(0, 6), ...sections.summary].join(" \n "),
    profile.skills
  )

  const filled = PROFILE_FIELDS.filter((f) => isFieldFilled(profile, f))
  return { profile, filled }
}
