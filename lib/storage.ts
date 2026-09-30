import "server-only"

import { mkdir, rm, writeFile } from "node:fs/promises"
import path from "node:path"

import { demoUploadsDir } from "@/lib/db/file-store"
import { supabaseAdmin } from "@/lib/db/supabase-store"
import { supabaseStoreEnabled } from "@/lib/env"

/** Private bucket; no public URLs are ever created for resumes. */
export const RESUME_BUCKET = "resumes"

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(-80) || "resume"
}

/** Stores the resume file privately under the user's folder. Returns the storage path. */
export async function putResumeFile(userId: string, fileName: string, bytes: Uint8Array, mime: string) {
  const objectPath = `${userId}/${Date.now()}-${safeName(fileName)}`
  if (supabaseStoreEnabled()) {
    const { error } = await supabaseAdmin()
      .storage.from(RESUME_BUCKET)
      .upload(objectPath, bytes, { contentType: mime, upsert: false })
    if (error) throw new Error(`storage upload failed: ${error.message}`)
    return objectPath
  }
  const full = path.join(demoUploadsDir(), objectPath)
  await mkdir(path.dirname(full), { recursive: true })
  await writeFile(full, bytes)
  return objectPath
}

/** Removes every file the user has stored. */
export async function deleteUserFiles(userId: string) {
  if (supabaseStoreEnabled()) {
    const bucket = supabaseAdmin().storage.from(RESUME_BUCKET)
    const { data } = await bucket.list(userId, { limit: 1000 })
    if (data?.length) await bucket.remove(data.map((f) => `${userId}/${f.name}`))
    return
  }
  await rm(path.join(demoUploadsDir(), userId), { recursive: true, force: true })
}
