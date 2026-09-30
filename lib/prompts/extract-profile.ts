import { z } from "zod"

import { TARGET_ROLES } from "@/lib/profile/types"

/** Tier 2 auto-fill: the LLM turns resume text into a structured profile. */

const str = z.string()
const list = z.array(z.string())

export const ExtractedProfileSchema = z.object({
  fullName: str,
  email: str,
  phone: str,
  location: str,
  college: str,
  degree: str,
  gradYear: str.describe("Four-digit graduation year, or empty"),
  targetRole: z.enum(["", ...TARGET_ROLES.map((r) => r.value)] as [string, ...string[]]),
  githubUsername: str,
  linkedinUrl: str,
  skills: z.object({ languages: list, frameworks: list, databases: list, tools: list }),
  projects: z.array(
    z.object({ title: str, description: str, tech: list, link: str, bullets: list })
  ),
  experience: z.array(z.object({ role: str, company: str, period: str, bullets: list })),
  education: z.array(z.object({ institution: str, degree: str, period: str, score: str })),
})
export type ExtractedProfile = z.infer<typeof ExtractedProfileSchema>

export const EXTRACT_PROFILE_SYSTEM = `You extract structured data from Indian engineering students' resumes for a portfolio builder.

Rules:
- Copy facts exactly as written. Never invent, guess or embellish anything. If a field isn't in the resume, return an empty string or empty list.
- fullName: the person's name only, without words like "Resume" or "CV".
- phone: Indian format "+91 98765 43210" when it's a 10-digit Indian mobile number.
- githubUsername: only the username from a github.com URL.
- linkedinUrl: the full https://www.linkedin.com/in/... URL.
- targetRole: one of backend, frontend, fullstack, mobile, data, devops, based on what the resume says the person wants or mostly does; empty if unclear.
- skills: group into languages, frameworks (including libraries), databases, and tools (cloud, devops, testing, design tools). Use standard spellings (e.g. "Node.js", "PostgreSQL").
- projects/experience bullets: keep the student's own sentences, lightly cleaned of bullet symbols. Don't rewrite them.
- gradYear: the year they graduate (or expect to).`

export function extractProfilePrompt(resumeText: string) {
  return `Extract the profile from this resume text. The text may come from a two-column PDF, so sections can be out of order.

<resume>
${resumeText}
</resume>`
}
