"use client"

import type { Profile } from "@/lib/profile/types"
import { getDraft, setDraft } from "./draft-store"
import { mergeAutofill } from "./merge"

/**
 * Tier 2: asks the server to refine the auto-filled profile with AI, in the background.
 * Only fields the student hasn't touched are updated (see mergeAutofill).
 */
export async function refineInBackground(text: string, attachedAt: number) {
  setDraft((d) => ({ ...d, refinement: "pending" }))
  try {
    const response = await fetch("/api/resume/extract-profile", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: text.slice(0, 40_000) }),
    })
    // The student may have replaced the file meanwhile: ignore stale results.
    if (getDraft().resume?.attachedAt !== attachedAt) return
    if (!response.ok) {
      setDraft((d) => ({ ...d, refinement: "unavailable" }))
      return
    }
    const { profile } = (await response.json()) as { profile: Partial<Profile> }
    setDraft((d) => {
      const merged = mergeAutofill(d.profile, d.fieldSources, profile, "llm")
      return {
        ...d,
        profile: merged.profile,
        fieldSources: merged.fieldSources,
        autofilled: Array.from(new Set([...d.autofilled, ...merged.changed])),
        refinement: "done",
      }
    })
  } catch {
    if (getDraft().resume?.attachedAt === attachedAt) setDraft((d) => ({ ...d, refinement: "unavailable" }))
  }
}
