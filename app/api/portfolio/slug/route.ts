import { NextResponse, type NextRequest } from "next/server"

import { getCurrentUser } from "@/lib/auth/session"
import { isSlugAvailable, suggestSlug } from "@/lib/data/portfolios"
import { isValidSlug, slugify } from "@/lib/draft/merge"

/** Is this portfolio link free? Suggests an alternative when it isn't. */
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("slug") ?? ""
  const slug = raw.toLowerCase()
  const user = await getCurrentUser()
  if (!isValidSlug(slug)) {
    const fallback = slugify(raw) || "my-portfolio"
    return NextResponse.json({ available: false, valid: false, suggestion: await suggestSlug(fallback, user?.id ?? null) })
  }
  const available = await isSlugAvailable(slug, user?.id ?? null)
  return NextResponse.json({
    available,
    valid: true,
    suggestion: available ? slug : await suggestSlug(slug, user?.id ?? null),
  })
}
