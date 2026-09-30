import { z } from "zod"

import type { CatalogProject, DefenseQuestion } from "@/content/projects"

export const DefenseJudgementSchema = z.object({
  covered: z.array(z.boolean()).describe("One entry per key point, in order: did the answer cover it?"),
  tip: z.string().describe("One or two sentences: the single most useful improvement, in plain English"),
  followUp: z.string().describe("A natural follow-up question an interviewer might ask next, about this same work"),
})

export const DEFENSE_SYSTEM = `You are a friendly senior engineer running a mock interview for an Indian engineering student about a project they built themselves.
- Judge only whether the answer covers each listed key point. Be fair: accept correct ideas in the student's own words, and ignore grammar and English fluency.
- Do not give a score. Do not invent details about their project beyond what is given.
- The tip is kind, specific and short. The follow-up stays within the work described.`

export function defensePrompt(project: CatalogProject, q: DefenseQuestion, completedDays: string[], answer: string) {
  return `Project: ${project.title} (${project.stack.join(", ")})
Work the student has completed: ${completedDays.join(" | ")}

Question: ${q.question}
Key points a strong answer covers:
${q.keyPoints.map((k, i) => `${i + 1}. ${k}`).join("\n")}

<answer>
${answer}
</answer>`
}
