import { z } from "zod";
import { error, json, parseBody } from "@/lib/http";
import { getDb, schema } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email";
import { site } from "@/config/site";

const body = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(200),
  organization: z.string().trim().min(1).max(150),
  kind: z.enum(["team", "college", "review", "other"]),
  seats: z.number().int().min(1).max(100_000).optional(),
  message: z.string().trim().max(4000).default(""),
  website: z.string().max(0).optional(), // honeypot
});

export async function POST(req: Request) {
  const rl = await rateLimit(`contact:${clientIp(req)}`, 5, 3600);
  if (!rl.ok) return error(429, "You've sent a few messages already. We'll reply soon.");
  const [data, bad] = await parseBody(req, body);
  if (bad) return bad;
  const db = await getDb();
  const { website: _hp, ...lead } = data;
  await db.insert(schema.leads).values({ ...lead, seats: lead.seats ?? null });
  await sendEmail({
    to: site.supportEmail,
    template: "lead",
    data: { ...lead, seats: lead.seats ? String(lead.seats) : undefined },
  }).catch(() => {});
  return json({ ok: true });
}
