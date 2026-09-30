import "server-only"

import { db } from "@/lib/db"
import { emptyProfile, type FieldSources, type Profile } from "@/lib/profile/types"
import type { ProfileRow } from "./records"

export const DEFAULT_TIMEZONE = "Asia/Kolkata"

export async function getProfile(userId: string): Promise<ProfileRow | null> {
  const row = await db().selectOne<ProfileRow>("profiles", { id: userId })
  if (!row) return null
  return { ...row, data: { ...emptyProfile(), ...(row.data ?? {}) } }
}

export async function saveProfile(
  userId: string,
  data: Profile,
  fieldSources: FieldSources,
  extra: Partial<Pick<ProfileRow, "email" | "avatar_url" | "timezone">> = {}
): Promise<ProfileRow> {
  const existing = await db().selectOne<ProfileRow>("profiles", { id: userId })
  return db().upsert<ProfileRow>(
    "profiles",
    {
      id: userId,
      email: extra.email ?? existing?.email ?? (data.email || null),
      full_name: data.fullName || null,
      avatar_url: extra.avatar_url ?? existing?.avatar_url ?? null,
      data,
      field_sources: fieldSources,
      timezone: extra.timezone ?? existing?.timezone ?? DEFAULT_TIMEZONE,
      reminder_time: existing?.reminder_time ?? "08:00",
      reminder_email: existing?.reminder_email ?? true,
    },
    ["id"]
  )
}

export async function updateSettings(
  userId: string,
  patch: Partial<Pick<ProfileRow, "timezone" | "reminder_time" | "reminder_email">>
) {
  const existing = await getProfile(userId)
  if (!existing) {
    return db().upsert<ProfileRow>(
      "profiles",
      {
        id: userId,
        data: emptyProfile(),
        field_sources: {},
        timezone: patch.timezone ?? DEFAULT_TIMEZONE,
        reminder_time: patch.reminder_time ?? "08:00",
        reminder_email: patch.reminder_email ?? true,
      },
      ["id"]
    )
  }
  const [row] = await db().update<ProfileRow>("profiles", { id: userId }, patch)
  return row
}
