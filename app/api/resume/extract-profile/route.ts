import { NextResponse } from "next/server"
import { z } from "zod"

import { isSameOrigin, jsonError } from "@/lib/auth/api"
import { getCurrentUser } from "@/lib/auth/session"
import { generateStructured, isLLMConfigured } from "@/lib/llm"
import { newId, type Profile } from "@/lib/profile/types"
import { EXTRACT_PROFILE_SYSTEM, ExtractedProfileSchema, extractProfilePrompt } from "@/lib/prompts/extract-profile"
import { clientKey, rateLimit } from "@/lib/rate-limit"

const Body = z.object({ text: z.string().min(40).max(40_000) })

/**
 * Tier 2 auto-fill. Works without an account. The resume text is used for this one
 * request only: it is not stored and never logged.
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError(403, "forbidden", "Request blocked.")
  if (!isLLMConfigured()) {
    return jsonError(503, "not_configured", "AI refinement isn't set up on this server.")
  }
  const user = await getCurrentUser()
  const limit = rateLimit(`extract:${clientKey(request, user?.id)}`, 6, 10 * 60_000)
  if (!limit.ok) {
    return jsonError(429, "rate_limited", "Too many requests. Please wait a few minutes.", {
      retryAfter: limit.retryAfter,
    })
  }

  const parsed = Body.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return jsonError(400, "bad_request", "That resume text couldn't be read.")

  const result = await generateStructured({
    task: "extract-profile",
    system: EXTRACT_PROFILE_SYSTEM,
    prompt: extractProfilePrompt(parsed.data.text),
    schema: ExtractedProfileSchema,
    effort: "low",
  })
  if (!result) return jsonError(502, "ai_failed", "AI refinement didn't finish. Your details are still saved.")

  const profile: Partial<Profile> = {
    ...result,
    targetRole: result.targetRole as Profile["targetRole"],
    projects: result.projects.map((p) => ({ ...p, id: newId("proj") })),
    experience: result.experience.map((e) => ({ ...e, id: newId("exp") })),
    education: result.education.map((e) => ({ ...e, id: newId("edu") })),
  }
  return NextResponse.json({ profile })
}
