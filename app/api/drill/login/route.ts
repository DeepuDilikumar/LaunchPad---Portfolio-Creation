import { site } from "@/config/site";
import { SimpleEmail } from "@/emails/SimpleEmail";
import { hasDrillAccess, loginToken } from "@/lib/drill";
import { renderEmail } from "@/lib/email/render";
import { getMailer } from "@/lib/email/send";
import { bad, json, readJson } from "@/lib/http";
import { isEmail, normaliseEmail } from "@/lib/ids";

export const dynamic = "force-dynamic";

/** Emails a 30-minute login link to buyers. Same reply either way, so it can't probe for buyers. */
export async function POST(req: Request) {
  if (!site.features.drill) return bad("Not found.", 404);
  const body = await readJson<{ email?: string }>(req);
  const email = body?.email ? normaliseEmail(body.email) : "";
  if (!isEmail(email)) return bad("Please enter a valid email.");
  if (await hasDrillAccess(email)) {
    const url = `${new URL(req.url).origin}/api/drill/verify?t=${encodeURIComponent(loginToken(email))}`;
    const { html, text } = await renderEmail(
      SimpleEmail({
        preview: "Your login link for the follow-up drill",
        heading: "Log in to the drill",
        paragraphs: ["This link works for 30 minutes on this device."],
        cta: { label: "Start drilling", url },
      }),
    );
    await getMailer().send({ to: email, subject: `Your ${site.name} drill login`, html, text });
  }
  return json({
    ok: true,
    message: "If that email bought a guide in the last 90 days, a login link is on its way.",
  });
}
