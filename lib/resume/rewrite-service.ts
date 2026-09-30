import "server-only"

import { db } from "@/lib/db"
import { getProfile } from "@/lib/data/profiles"
import { generateStructured } from "@/lib/llm"
import type { Profile } from "@/lib/profile/types"
import { REWRITE_SYSTEM, RewriteSchema, rewritePrompt } from "@/lib/prompts/rewrite"
import { collectBullets, type RewriteBullet } from "./document"
import { ruleRewrite } from "./rewrite-rules"

type RewriteRow = { id: string; user_id: string; bullets: RewriteBullet[]; source: "ai" | "rules" }

export async function getRewrite(userId: string) {
  return db().selectOne<RewriteRow>("resume_rewrites", { user_id: userId })
}

/**
 * Suggests a rewrite for every bullet. Bullets the student already accepted, edited or
 * rejected keep their decision as long as the original text is unchanged.
 */
export async function generateRewrite(userId: string): Promise<{ bullets: RewriteBullet[]; source: "ai" | "rules"; profile: Profile } | null> {
  const profile = await getProfile(userId)
  if (!profile) return null
  const base = collectBullets(profile.data)
  const existing = await getRewrite(userId)
  const previous = new Map((existing?.bullets ?? []).map((b) => [b.id, b]))

  const needed = base.filter((b) => previous.get(b.id)?.original !== b.original)
  let suggestions = new Map<string, string>()
  let source: "ai" | "rules" = existing?.source ?? "rules"

  if (needed.length) {
    const techFor = (parentId: string) =>
      profile.data.projects.find((p) => p.id === parentId)?.tech.join(", ") ?? ""
    const ai = await generateStructured({
      task: "resume-rewrite",
      system: REWRITE_SYSTEM,
      prompt: rewritePrompt(needed.map((b) => ({ id: b.id, context: b.parent, tech: techFor(b.parentId), text: b.original }))),
      schema: RewriteSchema,
      effort: "low",
    })
    if (ai) {
      suggestions = new Map(ai.bullets.map((b) => [b.id, b.text.trim().replace(/\.$/, "")]))
      source = "ai"
    }
  }

  const bullets: RewriteBullet[] = base.map((b) => {
    const prev = previous.get(b.id)
    if (prev && prev.original === b.original) return { ...prev, parent: b.parent }
    const suggested = suggestions.get(b.id) || ruleRewrite(b.original)
    return { ...b, suggested, final: suggested, status: "pending" }
  })

  await db().upsert<RewriteRow>("resume_rewrites", { user_id: userId, bullets, source }, ["user_id"])
  return { bullets, source, profile: profile.data }
}

export async function saveRewriteDecisions(userId: string, updates: Pick<RewriteBullet, "id" | "status" | "final">[]) {
  const existing = await getRewrite(userId)
  if (!existing) return null
  const byId = new Map(updates.map((u) => [u.id, u]))
  const bullets = existing.bullets.map((b) => {
    const u = byId.get(b.id)
    return u ? { ...b, status: u.status, final: u.final.slice(0, 400) } : b
  })
  await db().update<RewriteRow>("resume_rewrites", { user_id: userId }, { bullets })
  return bullets
}
