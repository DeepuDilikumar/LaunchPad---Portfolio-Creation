/**
 * Pure merge rules for auto-fill. The one promise: a field the student edited is never
 * overwritten by the parser or the background AI refinement.
 */
import {
  PROFILE_FIELDS,
  isFieldFilled,
  type FieldSource,
  type FieldSources,
  type Profile,
  type ProfileField,
  type Skills,
} from "@/lib/profile/types"

export type MergeResult = {
  profile: Profile
  fieldSources: FieldSources
  /** Fields whose value changed in this merge. */
  changed: ProfileField[]
}

function sameValue(a: unknown, b: unknown) {
  return JSON.stringify(a) === JSON.stringify(b)
}

/**
 * Merges auto-filled values into the profile.
 * - Fields marked "user" are left alone.
 * - Empty incoming values never erase existing ones.
 * - `source: "resume"` (a new upload) replaces earlier auto-filled values;
 *   `source: "llm"` refines them.
 */
export function mergeAutofill(
  current: Profile,
  sources: FieldSources,
  incoming: Partial<Profile>,
  source: Exclude<FieldSource, "user">
): MergeResult {
  const profile: Profile = structuredClone(current)
  const fieldSources: FieldSources = { ...sources }
  const changed: ProfileField[] = []

  for (const field of PROFILE_FIELDS) {
    if (!(field in incoming)) continue
    if (fieldSources[field] === "user") continue
    const value = incoming[field]
    const probe = { ...profile, [field]: value } as Profile
    if (!isFieldFilled(probe, field)) continue

    let next = value
    if (field === "skills") {
      // Merge skill lists instead of replacing, keeping order and removing duplicates.
      const base = source === "resume" ? { languages: [], frameworks: [], databases: [], tools: [] } : profile.skills
      const add = value as Skills
      next = Object.fromEntries(
        (Object.keys(add) as (keyof Skills)[]).map((k) => [k, Array.from(new Set([...base[k], ...add[k]]))])
      ) as Skills
    }
    if (!sameValue(profile[field], next)) {
      ;(profile as Record<ProfileField, unknown>)[field] = next
      changed.push(field)
    }
    fieldSources[field] = source
  }
  return { profile, fieldSources, changed }
}

/** Records a student's own edit. From now on auto-fill won't touch this field. */
export function applyUserEdit<F extends ProfileField>(
  current: Profile,
  sources: FieldSources,
  field: F,
  value: Profile[F]
): { profile: Profile; fieldSources: FieldSources } {
  return {
    profile: { ...current, [field]: value },
    fieldSources: { ...sources, [field]: "user" },
  }
}

/** URL-safe slug from a name: "Priya Nair" → "priya-nair". */
export function slugify(value: string): string {
  const slug = value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "")
  return slug.length >= 3 ? slug : ""
}

export const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/
export const RESERVED_SLUGS = new Set(["admin", "api", "app", "login", "start", "home", "report", "program", "settings", "launchpad", "demo", "sample", "privacy", "help", "support"])

export function isValidSlug(slug: string) {
  return SLUG_PATTERN.test(slug) && !slug.includes("--") && !RESERVED_SLUGS.has(slug)
}
