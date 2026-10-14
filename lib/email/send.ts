import fs from "node:fs";
import path from "node:path";
import { Resend } from "resend";
import { site } from "@/config/site";

export interface OutgoingEmail {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Same key → the provider sends at most once. */
  idempotencyKey?: string;
  attachments?: { filename: string; content: Buffer }[];
  headers?: Record<string, string>;
  tags?: { name: string; value: string }[];
}

export interface Mailer {
  send(email: OutgoingEmail): Promise<{ id: string }>;
}

class ResendMailer implements Mailer {
  private client: Resend;
  constructor(
    key: string,
    private from: string,
  ) {
    this.client = new Resend(key);
  }
  async send(e: OutgoingEmail) {
    const res = await this.client.emails.send(
      {
        from: this.from,
        to: e.to,
        replyTo: site.support.email,
        subject: e.subject,
        html: e.html,
        text: e.text,
        attachments: e.attachments,
        headers: e.headers,
        tags: e.tags,
      },
      e.idempotencyKey ? { idempotencyKey: e.idempotencyKey } : undefined,
    );
    if (res.error) throw new Error(`resend: ${res.error.message}`);
    return { id: res.data!.id };
  }
}

/** Development and tests: keeps sent mail in memory and writes it to .data/outbox. */
export class OutboxMailer implements Mailer {
  sent: OutgoingEmail[] = [];
  private keys = new Set<string>();
  constructor(private dir?: string) {}
  async send(e: OutgoingEmail) {
    if (e.idempotencyKey && this.keys.has(e.idempotencyKey))
      return { id: `dup-${e.idempotencyKey}` };
    if (e.idempotencyKey) this.keys.add(e.idempotencyKey);
    this.sent.push(e);
    const id = `outbox-${this.sent.length}`;
    if (this.dir) {
      fs.mkdirSync(this.dir, { recursive: true });
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      fs.writeFileSync(
        path.join(this.dir, `${stamp}-${e.to.replace(/[^a-z0-9@.]/gi, "_")}.html`),
        e.html,
      );
      console.log(`[outbox] ${e.to} · ${e.subject}`);
    }
    return { id };
  }
}

const g = globalThis as unknown as { __sqMailer?: Mailer };

export function getMailer(): Mailer {
  if (g.__sqMailer) return g.__sqMailer;
  const key = process.env.RESEND_API_KEY;
  g.__sqMailer = key
    ? new ResendMailer(key, process.env.EMAIL_FROM ?? `${site.name} <hello@${site.domain}>`)
    : new OutboxMailer(path.join(process.cwd(), ".data", "outbox"));
  return g.__sqMailer;
}

export function setMailer(m: Mailer | undefined): void {
  g.__sqMailer = m;
}
