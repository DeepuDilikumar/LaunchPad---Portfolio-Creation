import { z } from "zod"

/**
 * The LaunchPad Rubric. Scores are computed in code from which checks are met
 * (see lib/diagnostic/score.ts); the LLM may only judge individual checks and cite evidence.
 * Bump RUBRIC_VERSION whenever checks or weights change (it invalidates cached reports).
 */
export const RUBRIC_VERSION = "2026-09-v1"
export const RUBRIC_TARGET = 85

export type PillarKey = "uniqueness" | "architecture" | "ats" | "github" | "defense"

export type RubricCheck = {
  id: string
  label: string
  weight: number
  /** "ai" checks may be judged by the LLM; "rules" checks are always deterministic. */
  judge: "ai" | "rules"
  /** What a screener notices when this check fails. */
  notice: string
  /** Specific, actionable fix. */
  fix: string
}

export type RubricPillar = {
  key: PillarKey
  title: string
  short: string
  checks: RubricCheck[]
}

export const RUBRIC: RubricPillar[] = [
  {
    key: "uniqueness",
    title: "Project uniqueness",
    short: "Do your projects look original, or like common tutorial builds?",
    checks: [
      {
        id: "u1",
        label: "Your top 2 projects aren't common tutorial clones",
        weight: 30,
        judge: "ai",
        notice: "Your top projects look like common tutorial clones, which screeners filter out quickly.",
        fix: "Replace your weakest clone with one project that solves a specific problem (for example a webhook delivery engine or a job queue). The 14-Day Program helps you build exactly this.",
      },
      {
        id: "u2",
        label: "At least one project solves a specific, real problem",
        weight: 20,
        judge: "ai",
        notice: "It isn't clear who your projects are for or what problem they solve.",
        fix: "Open each project with one line on the problem and who has it, e.g. 'Lets college clubs collect event fees over UPI'.",
      },
      {
        id: "u3",
        label: "At least one project goes beyond basic create/read/update/delete",
        weight: 20,
        judge: "ai",
        notice: "Your projects read as basic CRUD apps, so there's little to discuss in an interview.",
        fix: "Add one hard part to your best project: real-time updates, a background job, search, rate limiting or payments.",
      },
      {
        id: "u4",
        label: "You have at least 2 substantial projects",
        weight: 15,
        judge: "rules",
        notice: "There are too few detailed projects to judge your skills.",
        fix: "Describe at least two projects with 2–3 bullets each: what it does, how you built it, and one result.",
      },
      {
        id: "u5",
        label: "Most projects list their tech stack and a link",
        weight: 15,
        judge: "rules",
        notice: "Screeners can't quickly see what you used or check your code.",
        fix: "Add the tech stack and a GitHub or live link next to every project title.",
      },
    ],
  },
  {
    key: "architecture",
    title: "Architectural depth",
    short: "Do your projects show the engineering product companies test for?",
    checks: [
      { id: "a1", label: "Uses caching (e.g. Redis) somewhere", weight: 15, judge: "ai", notice: "No sign of caching, a staple SDE-1 interview topic.", fix: "Cache one slow or repeated read (Redis or in-memory) and write down the hit rate before/after." },
      { id: "a2", label: "Uses queues or background jobs", weight: 15, judge: "ai", notice: "Everything seems to run in the request path; no async processing.", fix: "Move one slow task (emails, retries, reports) to a queue with a worker. Mention it on your resume." },
      { id: "a3", label: "Shows data modelling or indexing decisions", weight: 15, judge: "ai", notice: "Database work isn't visible beyond storing data.", fix: "Add an index for your most common query and note the query-time improvement." },
      { id: "a4", label: "Handles authentication or security properly", weight: 15, judge: "ai", notice: "No mention of auth or security practices.", fix: "Add proper auth (hashed passwords, JWT or sessions, role checks) and say so in one bullet." },
      { id: "a5", label: "Handles failures (retries, timeouts, idempotency, rate limits)", weight: 20, judge: "ai", notice: "Nothing shows what happens when things fail, which interviewers always ask about.", fix: "Add retries with backoff and idempotency to one external call, and describe the failure you handled." },
      { id: "a6", label: "Has automated tests or CI", weight: 20, judge: "ai", notice: "No evidence of testing.", fix: "Add unit tests for your core logic and a GitHub Actions workflow that runs them on every push." },
    ],
  },
  {
    key: "ats",
    title: "ATS readability",
    short: "Can applicant tracking systems read your resume correctly?",
    checks: [
      { id: "t1", label: "Single-column layout", weight: 20, judge: "rules", notice: "A two-column layout can be read out of order by ATS software.", fix: "Switch to a single-column resume. LaunchPad's ATS rewrite exports one." },
      { id: "t2", label: "No tables used for text", weight: 15, judge: "rules", notice: "Text inside tables is often skipped or scrambled by ATS parsers.", fix: "Replace tables with plain lines, e.g. 'B.Tech CSE · Model Engineering College · 2026 · 8.4 CGPA'." },
      { id: "t3", label: "Standard section headings", weight: 20, judge: "rules", notice: "ATS software may not find your sections under unusual headings.", fix: "Use the headings Education, Skills, Projects and Experience." },
      { id: "t4", label: "Email and phone are present", weight: 10, judge: "rules", notice: "Contact details are missing or unreadable.", fix: "Put your email and phone on the first line under your name, as plain text." },
      { id: "t5", label: "Dates are in a parseable format", weight: 10, judge: "rules", notice: "Dates are missing or in a format ATS can't read.", fix: "Write dates like 'Jun 2024 – Aug 2024' for every role and your degree." },
      { id: "t6", label: "Covers the key terms for your target role", weight: 25, judge: "rules", notice: "Your resume is missing terms that SDE-1 job descriptions for your role usually ask for.", fix: "Add the missing terms where they're true for you, inside project bullets rather than a keyword list." },
    ],
  },
  {
    key: "github",
    title: "GitHub signal",
    short: "Does your GitHub show steady, real work?",
    checks: [
      { id: "g1", label: "Commits in at least 8 of the last 12 weeks", weight: 30, judge: "rules", notice: "Your GitHub activity is sparse or bursty.", fix: "Commit small, real progress most days. The 14-Day Program builds this habit with genuine daily commits." },
      { id: "g2", label: "Your top repos have a useful README", weight: 25, judge: "rules", notice: "Repos without READMEs make screeners guess what they are.", fix: "Add a README with what it does, how to run it, and one architecture diagram or screenshot." },
      { id: "g3", label: "At least 3 original repos with descriptions", weight: 20, judge: "rules", notice: "Few original, described repositories are visible.", fix: "Pin your 3 best original repos and give each a one-line description." },
      { id: "g4", label: "Commit messages are descriptive", weight: 25, judge: "rules", notice: "Commit messages like 'update' or 'fix' hide what you did.", fix: "Write messages that say what changed and why, e.g. 'Add exponential backoff to webhook retries'." },
    ],
  },
  {
    key: "defense",
    title: "Interview defense readiness",
    short: "Can your projects hold up to system-design follow-up questions?",
    checks: [
      { id: "d1", label: "Projects mention design decisions or trade-offs", weight: 25, judge: "ai", notice: "Your bullets list features, not decisions, so follow-up questions will be hard.", fix: "For your main project, write down 3 decisions you made and the alternative you rejected for each." },
      { id: "d2", label: "Results are measured with numbers", weight: 25, judge: "rules", notice: "No numbers show the impact or scale of your work.", fix: "Add one real number per project: users, requests per second, latency, or time saved. Don't invent them; measure." },
      { id: "d3", label: "At least one project has several moving parts", weight: 25, judge: "ai", notice: "Your projects are single-component apps, which limits system-design discussion.", fix: "Build one project with at least an API, a database and one supporting component (cache, queue or worker)." },
      { id: "d4", label: "At least one project is deployed or containerised", weight: 25, judge: "rules", notice: "Nothing shows your work running outside your laptop.", fix: "Deploy one project (Render, Railway, Vercel or AWS free tier) or add a Docker Compose setup." },
    ],
  },
]

/** The pillar shown in full on the free tier. */
export const FREE_PILLAR: PillarKey = "uniqueness"

/** Terms SDE-1 job descriptions for each role commonly list (used for ATS keyword coverage). */
export const ROLE_KEYWORDS: Record<string, string[]> = {
  backend: ["REST", "API", "SQL", "database", "Git", "Docker", "testing", "caching", "microservices", "Linux"],
  frontend: ["JavaScript", "TypeScript", "React", "HTML", "CSS", "responsive", "accessibility", "testing", "Git", "REST"],
  fullstack: ["JavaScript", "React", "Node.js", "REST", "API", "SQL", "Git", "Docker", "testing", "authentication"],
  mobile: ["Android", "Kotlin", "Flutter", "REST", "API", "Git", "testing", "offline", "performance", "Firebase"],
  data: ["Python", "SQL", "Pandas", "machine learning", "statistics", "model", "Git", "data pipeline", "visualization", "evaluation"],
  devops: ["Linux", "Docker", "Kubernetes", "CI/CD", "AWS", "Terraform", "monitoring", "Bash", "Git", "networking"],
}

export const COMMON_CLONES = [
  "weather", "to-do", "todo", "to do", "calculator", "tic tac toe", "tic-tac-toe", "bookstore", "book store",
  "library management", "netflix clone", "amazon clone", "spotify clone", "youtube clone", "instagram clone",
  "twitter clone", "whatsapp clone", "portfolio website", "personal portfolio", "quiz app", "expense tracker",
  "notes app", "note taking", "movie app", "recipe app", "student management", "hospital management",
  "hotel management", "blog app", "chat app", "e-commerce website", "ecommerce website", "landing page",
  "calculator app", "random password", "digital clock", "snake game",
]

/* ---------- LLM judging (only for checks with judge: "ai") ---------- */

export const AiJudgementSchema = z.object({
  checks: z.array(
    z.object({
      id: z.string(),
      met: z.boolean(),
      evidence: z.string().describe("One short sentence quoting or pointing to the resume"),
    })
  ),
})

export const DIAGNOSTIC_SYSTEM = `You review Indian engineering students' resumes against a fixed rubric of what product-company SDE-1 screeners look for.

Rules:
- Judge ONLY the checks you are given, each as met or not met, strictly from the resume and profile text.
- Evidence must point to what is (or isn't) in the resume. Never invent projects, numbers or skills.
- A project is a "common tutorial clone" if it is a well-known beginner build (weather app, to-do list, calculator, Netflix/Amazon clone, library or student management system, basic blog/chat/e-commerce) without a clearly unusual twist.
- Be fair but strict: a keyword alone doesn't count if it's only in a skills list; look for use inside a project or role.
- You do not produce scores. Code computes them from your met/not-met answers.`

export function diagnosticPrompt(input: { resumeText: string; profileJson: string; checks: RubricCheck[] }) {
  return `Checks to judge:
${input.checks.map((c) => `- ${c.id}: ${c.label}`).join("\n")}

<profile>
${input.profileJson}
</profile>

<resume>
${input.resumeText}
</resume>`
}
