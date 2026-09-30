import { revalidatePath } from "next/cache"
import { NextResponse } from "next/server"
import { z } from "zod"

import { logEvent } from "@/lib/analytics/server"
import { isResponse, isSameOrigin, jsonError, userOrUnauthorized } from "@/lib/auth/api"
import { isSlugAvailable, publishPortfolio, suggestSlug } from "@/lib/data/portfolios"
import { saveProfile } from "@/lib/data/profiles"
import { saveResume } from "@/lib/data/resumes"
import { isValidSlug } from "@/lib/draft/merge"
import { siteUrl } from "@/lib/env"
import { buildContent } from "@/lib/portfolio/build"
import { writeSummary } from "@/lib/portfolio/summary"
import { TEMPLATES } from "@/lib/portfolio/types"
import { emptyProfile, type FieldSources, type Profile } from "@/lib/profile/types"
import { putResumeFile } from "@/lib/storage"

const MAX_FILE = 5 * 1024 * 1024
const ALLOWED_MIME = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
])

const Payload = z.object({
  profile: z.record(z.string(), z.unknown()),
  fieldSources: z.record(z.string(), z.enum(["resume", "llm", "user"])).default({}),
  template: z.enum(TEMPLATES.map((t) => t.key) as [string, ...string[]]),
  summary: z.string().max(600).default(""),
  slug: z.string().max(40),
  showPhone: z.boolean().default(false),
  timezone: z.string().max(64).optional(),
  resume: z
    .object({
      fileName: z.string().max(200),
      mime: z.string().max(120),
      size: z.number().int().nonnegative(),
      format: z.enum(["PDF", "DOCX", "TXT", "Manual"]),
      layout: z.enum(["single-column", "two-column", "unknown"]),
      hasTables: z.boolean(),
      text: z.string().max(80_000),
    })
    .nullable(),
})

/** Publishes the onboarding draft: saves profile + resume privately, creates the public page. */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError(403, "forbidden", "Request blocked.")
  const user = await userOrUnauthorized()
  if (isResponse(user)) return user

  const form = await request.formData().catch(() => null)
  const raw = form?.get("payload")
  let json: unknown = null
  try {
    json = typeof raw === "string" ? JSON.parse(raw) : null
  } catch {
    json = null
  }
  const parsed = Payload.safeParse(json)
  if (!parsed.success) return jsonError(400, "bad_request", "Some details didn't come through. Please try again.")
  const data = parsed.data

  const profile: Profile = { ...emptyProfile(), ...(data.profile as Partial<Profile>) }
  if (!profile.fullName.trim() || !profile.email.trim()) {
    return jsonError(400, "missing_details", "Add your name and email before publishing.")
  }

  const slug = data.slug.toLowerCase()
  if (!isValidSlug(slug)) {
    return jsonError(400, "bad_slug", "Use 3–40 lowercase letters, numbers or dashes for your link.")
  }
  if (!(await isSlugAvailable(slug, user.id))) {
    return jsonError(409, "slug_taken", "That link is already taken.", { suggestion: await suggestSlug(slug, user.id) })
  }

  const timezone = data.timezone && /^[A-Za-z_]+\/[A-Za-z_/+-]+$/.test(data.timezone) ? data.timezone : undefined
  await saveProfile(user.id, profile, data.fieldSources as FieldSources, {
    email: user.email ?? profile.email,
    avatar_url: user.avatarUrl,
    timezone,
  })

  // The resume file is stored privately; only its text is used for the diagnostic.
  if (data.resume && data.resume.format !== "Manual") {
    let storagePath: string | null = null
    const file = form?.get("file")
    if (file instanceof File && file.size > 0 && file.size <= MAX_FILE && ALLOWED_MIME.has(file.type)) {
      storagePath = await putResumeFile(user.id, file.name, new Uint8Array(await file.arrayBuffer()), file.type)
    }
    await saveResume({
      user_id: user.id,
      storage_path: storagePath,
      file_name: data.resume.fileName,
      mime: data.resume.mime,
      size_bytes: data.resume.size,
      format: data.resume.format,
      layout: data.resume.layout,
      has_tables: data.resume.hasTables,
      extracted_text: data.resume.text,
    })
  }

  const summary = data.summary.trim() || (await writeSummary(profile)).summary
  const content = buildContent(profile, data.template as (typeof TEMPLATES)[number]["key"], summary, data.showPhone)
  const row = await publishPortfolio(user.id, slug, content)

  await logEvent("portfolio_created", user.id, { template: content.template })
  revalidatePath(`/p/${row.slug}`)

  return NextResponse.json({ slug: row.slug, url: `${siteUrl()}/p/${row.slug}` })
}
