import "server-only"

import { db } from "@/lib/db"
import type { EventName } from "./client"

/** Server-side event log. Props are counts/keys only: never personal data or resume content. */
export async function logEvent(
  name: EventName,
  userId: string | null,
  props: Record<string, string | number | boolean> = {},
  anonId: string | null = null
) {
  try {
    await db().insert("events", { name, user_id: userId, anon_id: anonId, props })
  } catch {
    // Analytics must never break a user action.
  }
}
