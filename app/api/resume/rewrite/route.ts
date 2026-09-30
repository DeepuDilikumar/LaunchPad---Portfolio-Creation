import { NextResponse } from "next/server"
import { z } from "zod"

import { isResponse, isSameOrigin, jsonError, userOrUnauthorized } from "@/lib/auth/api"
import { getEntitlements } from "@/lib/data/entitlements"
import { generateRewrite, saveRewriteDecisions } from "@/lib/resume/rewrite-service"

async function gate(request: Request) {
  if (!isSameOrigin(request)) return jsonError(403, "forbidden", "Request blocked.")
  const user = await userOrUnauthorized()
  if (isResponse(user)) return user
  if (!(await getEntitlements(user.id)).report) {
    return jsonError(402, "locked", "The resume rewrite comes with the full report.")
  }
  return user
}

/** Generates (or refreshes) rewrite suggestions, keeping earlier decisions. */
export async function POST(request: Request) {
  const user = await gate(request)
  if (isResponse(user)) return user
  const result = await generateRewrite(user.id)
  if (!result) return jsonError(404, "no_profile", "Add your projects or experience first.")
  return NextResponse.json({ bullets: result.bullets, source: result.source })
}

const Decisions = z.object({
  bullets: z
    .array(
      z.object({
        id: z.string().max(80),
        status: z.enum(["pending", "accepted", "edited", "rejected"]),
        final: z.string().max(400),
      })
    )
    .max(80),
})

/** Saves accept / edit / reject decisions (auto-saved as the student works). */
export async function PUT(request: Request) {
  const user = await gate(request)
  if (isResponse(user)) return user
  const parsed = Decisions.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return jsonError(400, "bad_request", "Couldn't save that change.")
  const bullets = await saveRewriteDecisions(user.id, parsed.data.bullets)
  if (!bullets) return jsonError(404, "no_rewrite", "Generate suggestions first.")
  return NextResponse.json({ ok: true })
}
