import "server-only"

import { db } from "@/lib/db"
import { isValidSlug } from "@/lib/draft/merge"
import type { PortfolioContent } from "@/lib/portfolio/types"
import type { PortfolioRow } from "./records"

export async function getPortfolioForUser(userId: string) {
  return db().selectOne<PortfolioRow>("portfolios", { user_id: userId })
}

export async function getPublishedPortfolio(slug: string) {
  if (!isValidSlug(slug)) return null
  return db().selectOne<PortfolioRow>("portfolios", { slug, is_published: true })
}

/** Available if nobody else has it (the student's own current slug counts as available). */
export async function isSlugAvailable(slug: string, userId: string | null) {
  if (!isValidSlug(slug)) return false
  const existing = await db().selectOne<PortfolioRow>("portfolios", { slug })
  return !existing || existing.user_id === userId
}

export async function suggestSlug(base: string, userId: string | null) {
  if (await isSlugAvailable(base, userId)) return base
  for (let i = 2; i < 50; i++) {
    const candidate = `${base.slice(0, 36)}-${i}`
    if (await isSlugAvailable(candidate, userId)) return candidate
  }
  return `${base.slice(0, 30)}-${Math.random().toString(36).slice(2, 6)}`
}

export async function publishPortfolio(userId: string, slug: string, content: PortfolioContent) {
  const existing = await getPortfolioForUser(userId)
  return db().upsert<PortfolioRow>(
    "portfolios",
    {
      user_id: userId,
      slug,
      content,
      is_published: true,
      published_at: existing?.published_at ?? new Date().toISOString(),
    },
    ["user_id"]
  )
}

export async function updatePortfolioContent(userId: string, content: PortfolioContent) {
  const [row] = await db().update<PortfolioRow>("portfolios", { user_id: userId }, { content })
  return row ?? null
}

export async function setPublished(userId: string, isPublished: boolean) {
  const [row] = await db().update<PortfolioRow>("portfolios", { user_id: userId }, { is_published: isPublished })
  return row ?? null
}
