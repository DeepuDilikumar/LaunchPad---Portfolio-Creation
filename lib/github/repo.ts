import "server-only"

import type { Octokit } from "@octokit/rest"

import { SCAFFOLD_COMMIT_MESSAGE } from "@/lib/program/scaffold"

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function sanitizeRepoName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
}

/**
 * Creates a public repo and makes its history exactly ONE commit: the LaunchPad scaffold.
 * GitHub's auto-created initial commit is replaced by a parentless commit containing only
 * the scaffold, so the student's history starts clean and honest.
 */
export async function createRepoWithScaffold(
  octokit: Octokit,
  login: string,
  name: string,
  description: string,
  files: Record<string, string>
) {
  const { data: repo } = await octokit.repos.createForAuthenticatedUser({
    name,
    description,
    private: false,
    auto_init: true,
    has_wiki: false,
  })
  const branch = repo.default_branch || "main"

  // The auto-init commit can take a moment to become visible to the Git Data API.
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      await octokit.git.getRef({ owner: login, repo: name, ref: `heads/${branch}` })
      break
    } catch {
      await sleep(700 * (attempt + 1))
    }
  }

  const { data: tree } = await octokit.git.createTree({
    owner: login,
    repo: name,
    tree: Object.entries(files).map(([path, content]) => ({ path, mode: "100644" as const, type: "blob" as const, content })),
  })
  const { data: commit } = await octokit.git.createCommit({
    owner: login,
    repo: name,
    message: `${SCAFFOLD_COMMIT_MESSAGE}\n\nStarter files for the LaunchPad 14-Day Program. Every later commit is the student's own work.`,
    tree: tree.sha,
    parents: [],
  })
  await octokit.git.updateRef({ owner: login, repo: name, ref: `heads/${branch}`, sha: commit.sha, force: true })

  return { owner: login, name, url: repo.html_url, scaffoldSha: commit.sha, branch }
}

export type FoundCommit = { sha: string; message: string; date: string; url: string }

/** The student's own commits on the repo since a moment, excluding already-counted ones. */
export async function commitsSince(
  octokit: Octokit,
  owner: string,
  repo: string,
  login: string,
  since: Date,
  exclude: Set<string>
): Promise<FoundCommit[]> {
  const { data } = await octokit.repos.listCommits({ owner, repo, author: login, since: since.toISOString(), per_page: 100 })
  return data
    .filter((c) => !exclude.has(c.sha))
    .filter((c) => (c.parents?.length ?? 0) <= 1) // skip merge commits
    .filter((c) => new Date(c.commit.committer?.date ?? 0).getTime() >= since.getTime())
    .map((c) => ({
      sha: c.sha,
      message: c.commit.message.split("\n")[0],
      date: c.commit.committer?.date ?? "",
      url: c.html_url,
    }))
}

/** A compact diff for an optional AI review (truncated; never the whole repo). */
export async function diffSummary(octokit: Octokit, owner: string, repo: string, shas: string[], maxChars = 12_000) {
  let out = ""
  for (const sha of shas.slice(0, 3)) {
    const { data } = await octokit.repos.getCommit({ owner, repo, ref: sha })
    out += `\n# ${data.commit.message.split("\n")[0]}\n`
    for (const f of data.files ?? []) {
      out += `\n--- ${f.filename} (+${f.additions} -${f.deletions})\n${(f.patch ?? "").slice(0, 3000)}\n`
      if (out.length > maxChars) return out.slice(0, maxChars)
    }
  }
  return out
}
