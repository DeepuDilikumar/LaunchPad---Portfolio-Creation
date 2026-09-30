import { NextResponse } from "next/server"
import { z } from "zod"

import { isResponse, isSameOrigin, jsonError, userOrUnauthorized } from "@/lib/auth/api"
import { getProfile, saveProfile } from "@/lib/data/profiles"
import { getPortfolioForUser, updatePortfolioContent } from "@/lib/data/portfolios"
import { getProgramSummary } from "@/lib/program/service"
import { emptyProfile, type ProjectEntry } from "@/lib/profile/types"

const Body = z.object({ bullets: z.array(z.string().trim().min(1).max(300)).min(1).max(5) })

/**
 * Adds (or updates) the program project in the student's profile, so it shows on their
 * portfolio and in the ATS resume. Only the student's confirmed bullets are used.
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError(403, "forbidden", "Request blocked.")
  const user = await userOrUnauthorized()
  if (isResponse(user)) return user
  const parsed = Body.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return jsonError(400, "bad_request", "Add at least one bullet first.")
  const summary = await getProgramSummary(user.id)
  if (!summary?.daysDone) return jsonError(400, "nothing_yet", "Finish Day 1 first.")

  const row = await getProfile(user.id)
  const profile = row?.data ?? emptyProfile()
  const id = `launchpad-${summary.project.key}`
  const entry: ProjectEntry = {
    id,
    title: summary.project.title,
    description: summary.project.tagline,
    tech: summary.project.stack.slice(0, 6),
    link: summary.program.repo_url ?? "",
    bullets: parsed.data.bullets.map((b) => b.replace(/^[•\-*]\s*/, "")),
  }
  const next = { ...profile, projects: [entry, ...profile.projects.filter((p) => p.id !== id)] }
  await saveProfile(user.id, next, { ...(row?.field_sources ?? {}), projects: "user" })

  const portfolio = await getPortfolioForUser(user.id)
  if (portfolio) await updatePortfolioContent(user.id, { ...portfolio.content, profile: next })
  return NextResponse.json({ ok: true })
}
