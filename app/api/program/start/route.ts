import { NextResponse } from "next/server"
import { z } from "zod"

import { getProject } from "@/content/projects"
import { isResponse, isSameOrigin, jsonError, userOrUnauthorized } from "@/lib/auth/api"
import { getEntitlements } from "@/lib/data/entitlements"
import { isDemoMode, isGithubConfigured } from "@/lib/env"
import { githubErrorCode, octokitFor } from "@/lib/github/client"
import { createRepoWithScaffold, sanitizeRepoName } from "@/lib/github/repo"
import { buildScaffold } from "@/lib/program/scaffold"
import { getActiveProgram, startProgram } from "@/lib/program/service"

const Body = z.object({
  projectKey: z.string().max(40),
  repoName: z.string().max(80).optional(),
  withoutGithub: z.boolean().optional(),
})

/** Starts the program: creates the GitHub repo with ONE labelled scaffold commit. */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError(403, "forbidden", "Request blocked.")
  const user = await userOrUnauthorized()
  if (isResponse(user)) return user
  if (!(await getEntitlements(user.id)).program) return jsonError(402, "locked", "Join the 14-Day Program to start.")
  if (await getActiveProgram(user.id)) return jsonError(409, "already_started", "You've already started a project.")

  const parsed = Body.safeParse(await request.json().catch(() => null))
  const project = parsed.success ? getProject(parsed.data.projectKey) : null
  if (!parsed.success || !project) return jsonError(400, "bad_request", "Pick a project first.")

  // Demo mode without GitHub: start with verification clearly marked as simulated.
  if (parsed.data.withoutGithub) {
    if (!isDemoMode() || isGithubConfigured()) return jsonError(400, "github_required", "Connect GitHub to start.")
    const program = await startProgram(user.id, project.key, null, true)
    return NextResponse.json({ programId: program.id })
  }

  const client = await octokitFor(user.id)
  if (!client) return jsonError(400, "github_not_connected", "Connect your GitHub account first.")

  const repoName = sanitizeRepoName(parsed.data.repoName || project.key)
  if (repoName.length < 2) return jsonError(400, "bad_repo_name", "Use letters, numbers and dashes for the repo name.")

  try {
    const repo = await createRepoWithScaffold(client.octokit, client.login, repoName, project.tagline, buildScaffold(project))
    const program = await startProgram(user.id, project.key, repo, false)
    return NextResponse.json({ programId: program.id, repoUrl: repo.url })
  } catch (error) {
    const code = githubErrorCode(error)
    const messages: Record<string, string> = {
      name_taken: `You already have a repo called "${repoName}". Choose another name, e.g. "${repoName}-lp".`,
      token_expired: "Your GitHub connection has expired. Reconnect GitHub and try again.",
      rate_limited: "GitHub is rate-limiting requests right now. Wait a minute and try again.",
      not_found: "GitHub couldn't find your account. Reconnect GitHub and try again.",
      unknown: "GitHub didn't create the repo. Nothing was pushed; please try again.",
    }
    return jsonError(code === "token_expired" ? 401 : 400, code, messages[code])
  }
}
