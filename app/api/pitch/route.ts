import { NextResponse } from "next/server"
import { z } from "zod"

import { isResponse, isSameOrigin, jsonError, userOrUnauthorized } from "@/lib/auth/api"
import { getEntitlements } from "@/lib/data/entitlements"
import { factsFor, generatePitch, saveDraft } from "@/lib/pitch/service"
import { getProgramSummary } from "@/lib/program/service"
import { clientKey, rateLimit } from "@/lib/rate-limit"

const Kind = z.enum(["linkedin", "bullets", "dm", "profile"])
const Tone = z.enum(["humble", "confident", "story"])

async function context() {
  const user = await userOrUnauthorized()
  if (isResponse(user)) return user
  const ent = await getEntitlements(user.id)
  if (!ent.program) return jsonError(403, "locked", "This is part of the 14-Day Build Program.")
  const summary = await getProgramSummary(user.id)
  if (!summary) return jsonError(404, "no_program", "Start the program first.")
  if (!summary.daysDone) return jsonError(400, "nothing_yet", "Finish Day 1 first, so there's real work to talk about.")
  return { user, summary }
}

/** Generate (or regenerate) a draft from the student's real, completed work. */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError(403, "forbidden", "Request blocked.")
  const parsed = z.object({ kind: Kind, tone: Tone.default("humble") }).safeParse(await request.json().catch(() => null))
  if (!parsed.success) return jsonError(400, "bad_request", "Something went wrong. Please try again.")
  const ctx = await context()
  if (isResponse(ctx)) return ctx
  if (!rateLimit(`pitch:${clientKey(request, ctx.user.id)}`, 30, 60 * 60_000).ok) {
    return jsonError(429, "rate_limited", "That's a lot of drafts this hour. Edit the one you have, or try again later.")
  }
  const { kind, tone } = parsed.data
  const facts = await factsFor(ctx.user.id, ctx.summary)
  const draft = await generatePitch(kind, kind === "linkedin" ? tone : "humble", facts)
  const toneKey = kind === "linkedin" ? tone : "default"
  await saveDraft(ctx.user.id, ctx.summary.program.id, kind, toneKey, draft.text, draft.source)
  return NextResponse.json({ text: draft.text, source: draft.source })
}

/** Save the student's own edits. */
export async function PUT(request: Request) {
  if (!isSameOrigin(request)) return jsonError(403, "forbidden", "Request blocked.")
  const parsed = z
    .object({ kind: Kind, tone: z.string().max(20), content: z.string().max(5000), source: z.enum(["ai", "rules"]) })
    .safeParse(await request.json().catch(() => null))
  if (!parsed.success) return jsonError(400, "bad_request", "Couldn't save that draft.")
  const ctx = await context()
  if (isResponse(ctx)) return ctx
  const { kind, tone, content, source } = parsed.data
  await saveDraft(ctx.user.id, ctx.summary.program.id, kind, tone, content, source)
  return NextResponse.json({ ok: true })
}
