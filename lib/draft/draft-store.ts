"use client"

import { useSyncExternalStore } from "react"

import type { TemplateKey } from "@/lib/portfolio/types"
import { emptyProfile, type FieldSources, type Profile, type ProfileField } from "@/lib/profile/types"
import type { ResumeFormat } from "@/lib/resume/extract-text"

/**
 * The onboarding draft. Lives in localStorage (`launchpad_draft_state`) so nothing is lost on
 * refresh or back/forward, before any account exists. The attached file itself is kept in
 * IndexedDB (it can be several MB). After sign-in it's also synced to the server.
 */
export const DRAFT_STORAGE_KEY = "launchpad_draft_state"
const FILE_DB = "launchpad_files"
const FILE_STORE = "files"
const FILE_KEY = "resume"

export type DraftResume = {
  fileName: string
  size: number
  mime: string
  format: ResumeFormat | "Manual"
  layout: "single-column" | "two-column" | "unknown"
  hasTables: boolean
  pages: number
  text: string
  attachedAt: number
}

export type DraftState = {
  version: 1
  profile: Profile
  fieldSources: FieldSources
  /** Fields filled automatically on the last upload, for the banner. */
  autofilled: ProfileField[]
  bannerDismissed: boolean
  resume: DraftResume | null
  refinement: "idle" | "pending" | "done" | "unavailable"
  template: TemplateKey | null
  templateChosen: boolean
  /** One-line intro for the portfolio (AI-written or rule-based), editable later. */
  summary: string
  summaryFor: string
  showPhone: boolean
  slug: string
  publishedSlug: string | null
  updatedAt: number
}

export function emptyDraft(): DraftState {
  return {
    version: 1,
    profile: emptyProfile(),
    fieldSources: {},
    autofilled: [],
    bannerDismissed: false,
    resume: null,
    refinement: "idle",
    template: null,
    templateChosen: false,
    summary: "",
    summaryFor: "",
    showPhone: false,
    slug: "",
    publishedSlug: null,
    updatedAt: 0,
  }
}

let snapshot: DraftState | null = null
const listeners = new Set<() => void>()

function read(): DraftState {
  if (snapshot) return snapshot
  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as Partial<DraftState>) : null
    snapshot =
      parsed?.version === 1
        ? { ...emptyDraft(), ...parsed, profile: { ...emptyProfile(), ...parsed.profile } }
        : emptyDraft()
  } catch {
    snapshot = emptyDraft()
  }
  return snapshot
}

export function getDraft(): DraftState {
  return read()
}

export function setDraft(updater: (draft: DraftState) => DraftState) {
  snapshot = { ...updater(read()), updatedAt: Date.now() }
  try {
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(snapshot))
  } catch {
    // Storage full or blocked: keep working in memory for this visit.
  }
  listeners.forEach((l) => l())
}

export function replaceDraft(next: DraftState) {
  setDraft(() => next)
}

export function clearDraft() {
  snapshot = emptyDraft()
  try {
    window.localStorage.removeItem(DRAFT_STORAGE_KEY)
  } catch {}
  void setDraftFile(null)
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  const onStorage = (event: StorageEvent) => {
    if (event.key !== DRAFT_STORAGE_KEY) return
    snapshot = null
    listeners.forEach((l) => l())
  }
  window.addEventListener("storage", onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener("storage", onStorage)
  }
}

const SERVER_SNAPSHOT = emptyDraft()

/** React hook: the current draft. `ready` is false during server render / first paint. */
export function useDraft(): { draft: DraftState; ready: boolean } {
  const draft = useSyncExternalStore(subscribe, read, () => SERVER_SNAPSHOT)
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  )
  return { draft, ready }
}

/* ---------- The attached file (IndexedDB) ---------- */

function openFiles(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(FILE_DB, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(FILE_STORE)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function setDraftFile(file: File | null): Promise<void> {
  try {
    const dbh = await openFiles()
    await new Promise<void>((resolve, reject) => {
      const tx = dbh.transaction(FILE_STORE, "readwrite")
      const store = tx.objectStore(FILE_STORE)
      if (file) store.put(file, FILE_KEY)
      else store.delete(FILE_KEY)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
    dbh.close()
  } catch {
    // IndexedDB unavailable (private mode): the extracted text in the draft is still kept.
  }
}

export async function getDraftFile(): Promise<File | null> {
  try {
    const dbh = await openFiles()
    const file = await new Promise<File | null>((resolve, reject) => {
      const tx = dbh.transaction(FILE_STORE, "readonly")
      const request = tx.objectStore(FILE_STORE).get(FILE_KEY)
      request.onsuccess = () => resolve((request.result as File | undefined) ?? null)
      request.onerror = () => reject(request.error)
    })
    dbh.close()
    return file
  } catch {
    return null
  }
}
