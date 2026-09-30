import "server-only"

import { generateStructured } from "@/lib/llm"
import type { Profile } from "@/lib/profile/types"
import { SUMMARY_SYSTEM, SummarySchema, summaryPrompt } from "@/lib/prompts/summary"
import { fallbackSummary } from "./build"

export async function writeSummary(profile: Profile): Promise<{ summary: string; source: "ai" | "rules" }> {
  const ai = await generateStructured({
    task: "portfolio-summary",
    system: SUMMARY_SYSTEM,
    prompt: summaryPrompt(profile),
    schema: SummarySchema,
    effort: "low",
    maxTokens: 2000,
  })
  if (ai?.summary.trim()) return { summary: ai.summary.trim(), source: "ai" }
  return { summary: fallbackSummary(profile), source: "rules" }
}
