import "server-only";
import { createHmac } from "node:crypto";
import { env, mock } from "@/lib/env";
import { site } from "@/config/site";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

export type EmailTemplate = "welcome" | "first_checkpoint_nudge" | "receipt" | "module_complete" | "proof_published" | "magic_link";

const transactional = new Set<EmailTemplate>(["receipt", "magic_link"]);

export function unsubscribeToken(userId: string) {
  return createHmac("sha256", env.authSecret).update(`unsub:${userId}`).digest("base64url").slice(0, 32);
}

function unsubscribeUrl(userId?: string) {
  if (!userId) return null;
  return `${env.siteUrl}/api/unsubscribe?u=${userId}&t=${unsubscribeToken(userId)}`;
}

/** Plain-text templates: short, calm, no hype. Values are escaped by being plain text. */
export function renderEmail(template: EmailTemplate, d: Record<string, string | undefined>): { subject: string; text: string } {
  const hi = d.name ? `Hi ${d.name},` : "Hi,";
  switch (template) {
    case "welcome":
      return {
        subject: `Welcome to ${site.name}`,
        text: `${hi}\n\nYour first checkpoint takes about ten minutes. Start here:\n${env.siteUrl}/learn/foundations/setup-agents\n\nEvery module gives you the exact prompt for your agent, what you should see, and what to do when it goes wrong.\n\n— ${site.name}`,
      };
    case "first_checkpoint_nudge":
      return {
        subject: "Your first checkpoint is ten minutes away",
        text: `${hi}\n\nYou signed up yesterday but haven't passed a checkpoint yet. The first one is setting up your agent and writing a CLAUDE.md:\n${env.siteUrl}/learn/foundations/setup-agents\n\n— ${site.name}`,
      };
    case "receipt":
      return {
        subject: `Receipt: ${d.product}`,
        text: `${hi}\n\nThanks for your purchase.\n\nProduct: ${d.product}\nAmount: ${d.amount}\nPayment ID: ${d.paymentId}\nDate: ${d.date}\n\nPrices include GST. Refunds within 7 days if you've completed less than 20% of a project: reply to this email.\n\nContinue here: ${env.siteUrl}${d.returnTo ?? "/dashboard"}\n\n— ${site.name}`,
      };
    case "module_complete":
      return {
        subject: `${d.project}: ${d.module} complete`,
        text: `${hi}\n\nYou finished ${d.module} in ${d.project}. Your decisions are in your build journal:\n${env.siteUrl}/journal\n\nNext module: ${env.siteUrl}/projects/${d.projectSlug}\n\n— ${site.name}`,
      };
    case "proof_published":
      return {
        subject: `Your ${d.project} proof page is live`,
        text: `${hi}\n\nYour proof page is published:\n${d.url}\n\nShare it on LinkedIn or link it from your resume.\n\n— ${site.name}`,
      };
    case "magic_link":
      return {
        subject: `Sign in to ${site.name}`,
        text: `Use this link to sign in. It expires in 15 minutes.\n\n${d.url}\n\nIf you didn't ask for this, ignore this email.`,
      };
  }
}

export async function sendEmail(input: { to: string; template: EmailTemplate; data: Record<string, string | undefined>; userId?: string }) {
  if (!transactional.has(input.template) && input.userId) {
    try {
      const db = await getDb();
      const [p] = await db.select({ ok: schema.profiles.marketingEmails }).from(schema.profiles).where(eq(schema.profiles.userId, input.userId)).limit(1);
      if (p && !p.ok) return { ok: true, skipped: "unsubscribed" as const };
    } catch {}
  }
  const { subject, text: body } = renderEmail(input.template, input.data);
  const unsub = transactional.has(input.template) ? null : unsubscribeUrl(input.userId);
  const text = unsub ? `${body}\n\nUnsubscribe: ${unsub}` : body;

  try {
    const db = await getDb();
    await db.insert(schema.emailLog).values({ userId: input.userId ?? null, to: input.to, template: input.template, subject });
  } catch (e) {
    console.error("[email] log failed", e);
  }

  if (mock.email) {
    console.log(`\n[email:console] to=${input.to} template=${input.template}\nSubject: ${subject}\n${text}\n`);
    return { ok: true, mocked: true };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.resendKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      from: env.emailFrom,
      to: [input.to],
      subject,
      text,
      ...(unsub ? { headers: { "List-Unsubscribe": `<${unsub}>` } } : {}),
    }),
  });
  if (!res.ok) console.error("[email] resend failed", res.status, await res.text().catch(() => ""));
  return { ok: res.ok, mocked: false };
}
