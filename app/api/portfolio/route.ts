import { revalidatePath } from "next/cache"
import { NextResponse } from "next/server"
import { z } from "zod"

import { isResponse, isSameOrigin, jsonError, userOrUnauthorized } from "@/lib/auth/api"
import { getPortfolioForUser, setPublished, updatePortfolioContent } from "@/lib/data/portfolios"
import { getProfile, saveProfile } from "@/lib/data/profiles"
import { SECTIONS, TEMPLATES, type PortfolioContent } from "@/lib/portfolio/types"
import { emptyProfile, type Profile } from "@/lib/profile/types"

const sectionKeys = SECTIONS.map((s) => s.key) as [string, ...string[]]
const Content = z.object({
  template: z.enum(TEMPLATES.map((t) => t.key) as [string, ...string[]]),
  headline: z.string().max(120),
  summary: z.string().max(600),
  sectionOrder: z.array(z.enum(sectionKeys)).max(10),
  hiddenSections: z.array(z.enum(sectionKeys)).max(10),
  showPhone: z.boolean(),
  profile: z.record(z.string(), z.unknown()),
})

/** Editor auto-save. */
export async function PUT(request: Request) {
  if (!isSameOrigin(request)) return jsonError(403, "forbidden", "Request blocked.")
  const user = await userOrUnauthorized()
  if (isResponse(user)) return user
  const parsed = z
    .object({ content: Content.optional(), isPublished: z.boolean().optional() })
    .safeParse(await request.json().catch(() => null))
  if (!parsed.success) return jsonError(400, "bad_request", "Couldn't save those changes. Please try again.")

  const existing = await getPortfolioForUser(user.id)
  if (!existing) return jsonError(404, "no_portfolio", "Publish your portfolio first.")

  if (parsed.data.content) {
    const c = parsed.data.content
    // Every section appears exactly once in the order.
    const order = Array.from(new Set([...c.sectionOrder, ...SECTIONS.map((s) => s.key)]))
    const content: PortfolioContent = {
      ...(c as unknown as PortfolioContent),
      sectionOrder: order as PortfolioContent["sectionOrder"],
      profile: { ...emptyProfile(), ...(c.profile as Partial<Profile>) },
    }
    await updatePortfolioContent(user.id, content)
    // Keep the profile (used by the diagnostic) in step with edits made in the editor.
    const current = await getProfile(user.id)
    if (JSON.stringify(current?.data) !== JSON.stringify(content.profile)) {
      await saveProfile(user.id, content.profile, current?.field_sources ?? {})
    }
  }
  if (typeof parsed.data.isPublished === "boolean") await setPublished(user.id, parsed.data.isPublished)

  revalidatePath(`/p/${existing.slug}`)
  return NextResponse.json({ ok: true, savedAt: new Date().toISOString() })
}
