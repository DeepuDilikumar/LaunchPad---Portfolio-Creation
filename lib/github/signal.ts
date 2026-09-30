import "server-only"

import type { GithubSignal } from "@/lib/diagnostic/types"
import { octokitFor } from "./client"

const WEAK_MESSAGE = /^(update|updates|fix|fixes|fixed|changes|commit|wip|test|minor|final|done|initial commit|first commit|add files via upload|\.+)\s*$/i

/** Reads public-facing GitHub signals for the diagnostic's GitHub pillar. Null if not connected. */
export async function getGithubSignal(userId: string): Promise<GithubSignal | null> {
  const client = await octokitFor(userId)
  if (!client) return null
  const { octokit, login } = client

  const { data: repos } = await octokit.repos.listForAuthenticatedUser({
    affiliation: "owner",
    sort: "pushed",
    per_page: 30,
    visibility: "public",
  })
  const original = repos.filter((r) => !r.fork)
  const top = original.slice(0, 5)

  let reposWithReadme = 0
  for (const repo of top) {
    try {
      const { data } = await octokit.repos.getReadme({ owner: login, repo: repo.name })
      if ((data.size ?? 0) >= 300) reposWithReadme++
    } catch {
      // No README.
    }
  }

  const since = new Date(Date.now() - 12 * 7 * 24 * 3600 * 1000)
  const weeks = new Set<number>()
  const messages: string[] = []
  for (const repo of original.slice(0, 8)) {
    try {
      const { data: commits } = await octokit.repos.listCommits({
        owner: login,
        repo: repo.name,
        author: login,
        since: since.toISOString(),
        per_page: 50,
      })
      for (const c of commits) {
        const date = new Date(c.commit.author?.date ?? c.commit.committer?.date ?? 0)
        weeks.add(Math.floor((Date.now() - date.getTime()) / (7 * 24 * 3600 * 1000)))
        messages.push(c.commit.message.split("\n")[0])
      }
    } catch {
      // Empty or inaccessible repo.
    }
  }
  const descriptive = messages.filter((m) => m.trim().length >= 12 && !WEAK_MESSAGE.test(m.trim())).length

  return {
    login,
    activeWeeks: [...weeks].filter((w) => w >= 0 && w < 12).length,
    reposWithReadme,
    topRepos: top.length,
    originalDescribedRepos: original.filter((r) => (r.description ?? "").trim().length > 10).length,
    descriptiveCommitRatio: messages.length ? descriptive / messages.length : 0,
  }
}
