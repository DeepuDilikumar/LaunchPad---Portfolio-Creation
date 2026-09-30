import { NextResponse } from "next/server"

import { logEvent } from "@/lib/analytics/server"
import { isResponse, isSameOrigin, jsonError, userOrUnauthorized } from "@/lib/auth/api"
import { getEntitlements } from "@/lib/data/entitlements"
import { DiagnosticError, getLatestReport, runDiagnostic, visibleReport, type Stage } from "@/lib/diagnostic/service"
import { clientKey, rateLimit } from "@/lib/rate-limit"

export async function GET() {
  const user = await userOrUnauthorized()
  if (isResponse(user)) return user
  const report = await getLatestReport(user.id)
  if (!report) return NextResponse.json({ report: null })
  return NextResponse.json({ report: visibleReport(report, await getEntitlements(user.id)) })
}

/**
 * Runs the diagnostic and streams honest progress as newline-delimited JSON:
 * {"type":"stage","stage":"reading"} … then {"type":"result","report":{…}}.
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError(403, "forbidden", "Request blocked.")
  const user = await userOrUnauthorized()
  if (isResponse(user)) return user
  if (!rateLimit(`diagnostic:${clientKey(request, user.id)}`, 10, 10 * 60_000).ok) {
    return jsonError(429, "rate_limited", "You've run this a lot. Please wait a few minutes.")
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (payload: unknown) => controller.enqueue(encoder.encode(`${JSON.stringify(payload)}\n`))
      try {
        const report = await runDiagnostic(user.id, (stage: Stage) => send({ type: "stage", stage }))
        const ent = await getEntitlements(user.id)
        await logEvent("teaser_viewed", user.id, { overall: report.overall, unlocked: ent.report })
        send({ type: "result", report: visibleReport(report, ent) })
      } catch (error) {
        const message =
          error instanceof DiagnosticError ? error.message : "Scoring didn't finish. Your data is safe; please try again."
        send({ type: "error", code: error instanceof DiagnosticError ? error.code : "failed", message })
      } finally {
        controller.close()
      }
    },
  })
  return new Response(stream, {
    headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store" },
  })
}
