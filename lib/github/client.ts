import "server-only"

import { Octokit } from "@octokit/rest"

import { db } from "@/lib/db"
import type { GithubConnectionRow } from "@/lib/data/records"
import { isGithubConfigured } from "@/lib/env"
import { decryptToken, encryptToken } from "./crypto"

export async function getGithubConnection(userId: string) {
  if (!isGithubConfigured()) return null
  return db().selectOne<GithubConnectionRow>("github_connections", { user_id: userId })
}

export async function saveGithubConnection(userId: string, token: string, user: { id: number; login: string }, scopes: string) {
  return db().upsert<GithubConnectionRow>(
    "github_connections",
    { user_id: userId, github_user_id: user.id, login: user.login, access_token_enc: encryptToken(token), scopes },
    ["user_id"]
  )
}

export async function deleteGithubConnection(userId: string) {
  await db().delete("github_connections", { user_id: userId })
}

/** An authenticated Octokit for the user, or null if they haven't connected GitHub. */
export async function octokitFor(userId: string): Promise<{ octokit: Octokit; login: string } | null> {
  const connection = await getGithubConnection(userId)
  if (!connection) return null
  return {
    octokit: new Octokit({ auth: decryptToken(connection.access_token_enc), userAgent: "LaunchPad" }),
    login: connection.login,
  }
}

/** Revokes the OAuth grant on GitHub's side (used on disconnect and account deletion). */
export async function revokeGithubGrant(userId: string) {
  const connection = await getGithubConnection(userId)
  if (!connection || !process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) return
  try {
    const basic = Buffer.from(`${process.env.GITHUB_CLIENT_ID}:${process.env.GITHUB_CLIENT_SECRET}`).toString("base64")
    await fetch(`https://api.github.com/applications/${process.env.GITHUB_CLIENT_ID}/grant`, {
      method: "DELETE",
      headers: {
        authorization: `Basic ${basic}`,
        accept: "application/vnd.github+json",
        "content-type": "application/json",
      },
      body: JSON.stringify({ access_token: decryptToken(connection.access_token_enc) }),
    })
  } catch {
    // Best effort: the token is deleted on our side regardless.
  }
}

export function githubErrorCode(error: unknown): "token_expired" | "name_taken" | "rate_limited" | "not_found" | "unknown" {
  const status = (error as { status?: number })?.status
  const message = String((error as { message?: string })?.message ?? "")
  if (status === 401) return "token_expired"
  if (status === 422 && /name already exists/i.test(message)) return "name_taken"
  if (status === 403 && /rate limit/i.test(message)) return "rate_limited"
  if (status === 404) return "not_found"
  return "unknown"
}
