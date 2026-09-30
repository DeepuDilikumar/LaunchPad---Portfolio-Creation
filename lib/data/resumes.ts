import "server-only"

import { createHash } from "node:crypto"

import { db } from "@/lib/db"
import type { ResumeRow } from "./records"

export function hashText(text: string) {
  return createHash("sha256").update(text.replace(/\s+/g, " ").trim()).digest("hex")
}

export async function getLatestResume(userId: string) {
  const rows = await db().select<ResumeRow>(
    "resumes",
    { user_id: userId },
    { order: { column: "created_at", ascending: false }, limit: 1 }
  )
  return rows[0] ?? null
}

export async function saveResume(row: Omit<ResumeRow, "id" | "created_at" | "text_hash">) {
  const text = row.extracted_text.slice(0, 60_000)
  const hash = hashText(text)
  const latest = await getLatestResume(row.user_id)
  // Re-publishing the same resume doesn't create duplicates.
  if (latest && latest.text_hash === hash && !row.storage_path) return latest
  return db().insert<ResumeRow>("resumes", { ...row, extracted_text: text, text_hash: hash })
}
