import "server-only"

import { db } from "@/lib/db"
import { supabaseAdmin } from "@/lib/db/supabase-store"
import type { TableName } from "@/lib/db/types"
import { supabaseStoreEnabled } from "@/lib/env"
import { deleteGithubConnection, revokeGithubGrant } from "@/lib/github/client"
import { deleteUserFiles } from "@/lib/storage"

/** Tables whose rows belong to one user and are removed on deletion. Children before parents. */
const OWNED: TableName[] = [
  "mentor_messages",
  "defense_sessions",
  "pitch_drafts",
  "program_days",
  "programs",
  "reminder_sends",
  "entitlements",
  "resume_rewrites",
  "diagnostics",
  "portfolios",
  "resumes",
  "draft_states",
]

/**
 * Deletes everything we hold about a user: files, rows, the GitHub grant and the auth account.
 * Payment records are kept for accounting, but unlinked from the person (user_id → null);
 * analytics events are unlinked the same way. The user's GitHub repo is theirs and is not touched.
 */
export async function deleteAccount(userId: string, opts: { isDemo: boolean }) {
  await revokeGithubGrant(userId)
  await deleteGithubConnection(userId)
  await deleteUserFiles(userId)
  const store = db()
  for (const table of OWNED) await store.delete(table, { user_id: userId })
  await store.update("orders", { user_id: userId }, { user_id: null })
  await store.update("events", { user_id: userId }, { user_id: null })
  await store.delete("profiles", { id: userId })
  if (!opts.isDemo && supabaseStoreEnabled()) {
    const { error } = await supabaseAdmin().auth.admin.deleteUser(userId)
    if (error) throw new Error("auth delete failed")
  }
}

/** Everything we store about the user, as JSON (their right to a copy). Resume files are listed, not embedded. */
export async function exportAccount(userId: string) {
  const store = db()
  const out: Record<string, unknown> = { exportedAt: new Date().toISOString() }
  out.profile = await store.selectOne("profiles", { id: userId })
  for (const table of [...OWNED, "orders"] as TableName[]) out[table] = await store.select(table, { user_id: userId })
  const gh = await store.selectOne<{ login: string }>("github_connections", { user_id: userId })
  out.github = gh ? { login: gh.login } : null // never the token
  return out
}
