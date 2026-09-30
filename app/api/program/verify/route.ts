import { revalidatePath } from "next/cache"
import { NextResponse } from "next/server"
import { z } from "zod"

import { logEvent } from "@/lib/analytics/server"
import { isResponse, isSameOrigin, jsonError, userOrUnauthorized } from "@/lib/auth/api"
import { getPortfolioForUser } from "@/lib/data/portfolios"
import type { DayReview } from "@/lib/data/records"
import { githubErrorCode, octokitFor } from "@/lib/github/client"
import { commitsSince, diffSummary } from "@/lib/github/repo"
import { generateStructured } from "@/lib/llm"
import { REVIEW_SYSTEM, ReviewSchema, reviewPrompt } from "@/lib/prompts/mentor"
import { isUnlocked, unlockTime } from "@/lib/program/schedule"
import { completeDay, getProgramSummary, usedShas } from "@/lib/program/service"

const Body = z.object({ day: z.number().int().min(1).max(14) })

/**
 * Verifies a day by finding the student's own commits pushed to their repo since that day
 * unlocked. Commits already counted for another day, merges and the scaffold are ignored.
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError(403, "forbidden", "Request blocked.")
  const user = await userOrUnauthorized()
  if (isResponse(user)) return user
  const parsed = Body.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return jsonError(400, "bad_request", "Which day?")
  const summary = await getProgramSummary(user.id)
  if (!summary) return jsonError(404, "no_program", "Start the program first.")
  const { program, project, days } = summary
  const dayNumber = parsed.data.day
  const day = project.days[dayNumber - 1]
  const started = new Date(program.started_at)

  if (!isUnlocked(dayNumber, started, program.timezone)) return jsonError(403, "locked", "This day hasn't unlocked yet.")
  const existing = days.find((d) => d.day_number === dayNumber)
  if (existing?.completed_at) return NextResponse.json({ ok: true, alreadyDone: true })

  const finish = async (shas: string[], review: DayReview | null, demo: boolean, commits: { sha: string; message: string; url: string }[]) => {
    await completeDay(program, dayNumber, { shas, review, demo })
    await logEvent("day_completed", user.id, { day: dayNumber, project: project.key, demo })
    const portfolio = await getPortfolioForUser(user.id)
    if (portfolio) revalidatePath(`/p/${portfolio.slug}`)
    return NextResponse.json({ ok: true, commits, review, demo })
  }

  if (program.demo) {
    return finish([], null, true, [])
  }

  const client = await octokitFor(user.id)
  if (!client || !program.repo_owner || !program.repo_name) {
    return jsonError(400, "github_not_connected", "Reconnect GitHub so we can check your commits.")
  }

  try {
    const since = unlockTime(dayNumber, started, program.timezone)
    const exclude = usedShas(days)
    if (program.scaffold_sha) exclude.add(program.scaffold_sha)
    const commits = await commitsSince(client.octokit, program.repo_owner, program.repo_name, client.login, since, exclude)
    if (commits.length === 0) {
      return jsonError(404, "no_commits", "No new commits from you since this day unlocked. Commit your work, push it, then check again.", {
        since: since.toISOString(),
      })
    }

    let review: DayReview | null = null
    const diff = await diffSummary(client.octokit, program.repo_owner, program.repo_name, commits.map((c) => c.sha)).catch(() => "")
    if (diff) {
      const ai = await generateStructured({
        task: "day-review",
        system: REVIEW_SYSTEM,
        prompt: reviewPrompt(day, diff),
        schema: ReviewSchema,
        effort: "low",
        maxTokens: 3000,
      })
      if (ai) review = { summary: ai.summary, suggestions: ai.suggestions, source: "ai" }
    }
    return finish(commits.map((c) => c.sha), review, false, commits)
  } catch (error) {
    const code = githubErrorCode(error)
    if (code === "token_expired") return jsonError(401, code, "Your GitHub connection has expired. Reconnect GitHub and check again.")
    if (code === "not_found") return jsonError(404, code, "We couldn't find your project repo. Was it renamed or deleted?")
    return jsonError(502, code, "GitHub didn't respond. Please try again in a minute.")
  }
}
