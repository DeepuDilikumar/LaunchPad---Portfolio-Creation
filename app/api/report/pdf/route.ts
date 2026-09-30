import { isResponse, jsonError, userOrUnauthorized } from "@/lib/auth/api"
import { getEntitlements } from "@/lib/data/entitlements"
import { getProfile } from "@/lib/data/profiles"
import { getLatestReport } from "@/lib/diagnostic/service"
import { renderReportPdf } from "@/lib/pdf/report-pdf"

export const runtime = "nodejs"

export async function GET() {
  const user = await userOrUnauthorized()
  if (isResponse(user)) return user
  if (!(await getEntitlements(user.id)).report) return jsonError(402, "locked", "The PDF comes with the full report.")
  const report = await getLatestReport(user.id)
  if (!report) return jsonError(404, "no_report", "Run your profile check first.")
  const profile = await getProfile(user.id)
  const pdf = await renderReportPdf(report, profile?.data.fullName || "Your report")
  return new Response(new Uint8Array(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": 'attachment; filename="launchpad-report.pdf"',
      "cache-control": "no-store",
    },
  })
}
