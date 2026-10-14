import * as Sentry from "@sentry/nextjs";
import { site } from "@/config/site";
import { getMailer } from "./email/send";

/** Something needs a human: report to Sentry and email the owner. Never throws. */
export async function alertOwner(
  subject: string,
  details: Record<string, unknown>,
  err?: unknown,
): Promise<void> {
  console.error(`[alert] ${subject}`, details, err);
  try {
    if (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN) {
      Sentry.captureException(err ?? new Error(subject), {
        extra: details,
        tags: { alert: subject },
      });
    }
  } catch {
    /* ignore */
  }
  const to = process.env.OWNER_EMAIL;
  if (!to) return;
  try {
    const body = JSON.stringify(details, null, 2);
    await getMailer().send({
      to,
      subject: `[${site.name}] ${subject}`,
      text: `${subject}\n\n${body}\n\n${err instanceof Error ? err.stack : String(err ?? "")}`,
      html: `<h3>${subject}</h3><pre>${body.replace(/</g, "&lt;")}</pre><pre>${String(err instanceof Error ? err.stack : (err ?? "")).replace(/</g, "&lt;")}</pre>`,
    });
  } catch (mailErr) {
    console.error("[alert] could not email owner", mailErr);
  }
}
