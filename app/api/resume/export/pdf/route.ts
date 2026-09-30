import { isResponse, jsonError, userOrUnauthorized } from "@/lib/auth/api"
import { getEntitlements } from "@/lib/data/entitlements"
import { getProfile } from "@/lib/data/profiles"
import { renderResumePdf } from "@/lib/pdf/resume-pdf"
import { buildResumeDocument } from "@/lib/resume/document"
import { getRewrite } from "@/lib/resume/rewrite-service"

export const runtime = "nodejs"

/** Downloads the ATS-safe resume with the student's accepted / edited bullets. */
export async function GET() {
  const user = await userOrUnauthorized()
  if (isResponse(user)) return user
  if (!(await getEntitlements(user.id)).report) return jsonError(402, "locked", "The ATS resume comes with the full report.")
  const profile = await getProfile(user.id)
  if (!profile) return jsonError(404, "no_profile", "Add your details first.")
  const rewrite = await getRewrite(user.id)
  const doc = buildResumeDocument(profile.data, rewrite?.bullets ?? [])
  const pdf = await renderResumePdf(doc)
  const fileName = `${(profile.data.fullName || "resume").replace(/[^a-zA-Z0-9]+/g, "-")}-resume.pdf`
  return new Response(new Uint8Array(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${fileName}"`,
      "cache-control": "no-store",
    },
  })
}
