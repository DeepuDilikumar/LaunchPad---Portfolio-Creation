import { z } from "zod"

import type { Profile } from "@/lib/profile/types"

export const SummarySchema = z.object({
  summary: z.string().describe("Two sentences, first person, under 45 words"),
})

export const SUMMARY_SYSTEM = `You write the one-line "About" intro for an Indian engineering student's portfolio website.

Rules:
- First person, plain and confident, like a real student would write. Two short sentences, under 45 words.
- Use only facts from the profile. Never invent numbers, companies, awards or skills.
- No clichés ("passionate", "hard-working", "seeking a challenging role"), no emojis, no hashtags.
- Mention the role they're aiming for and one or two things they've actually built.`

export function summaryPrompt(profile: Profile) {
  const facts = {
    targetRole: profile.targetRole,
    college: profile.college,
    degree: profile.degree,
    gradYear: profile.gradYear,
    skills: profile.skills,
    projects: profile.projects.map((p) => ({ title: p.title, description: p.description, tech: p.tech })),
    experience: profile.experience.map((e) => ({ role: e.role, company: e.company })),
  }
  return `Write the intro from this profile:\n${JSON.stringify(facts, null, 2)}`
}
