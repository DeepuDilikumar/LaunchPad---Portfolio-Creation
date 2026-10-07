import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { error, json, parseBody } from "@/lib/http";
import { getDb, schema } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { catalog } from "@/content/catalog";

const valid = new Set(catalog.flatMap((p) => p.modules.map((m) => `${p.slug}/${m.slug}`)));

export async function POST(req: Request) {
  const rl = await rateLimit(`notify:${clientIp(req)}`, 10, 3600);
  if (!rl.ok) return error(429, "Too many requests. Try again later.");
  const [data, bad] = await parseBody(req, z.object({ moduleSlug: z.string().max(120), email: z.string().email().max(200).optional() }));
  if (bad) return bad;
  if (!valid.has(data.moduleSlug)) return error(404, "Unknown module.");
  const user = await getSessionUser();
  if (!user && !data.email) return error(400, "Add your email so we can tell you when it's out.");
  const db = await getDb();
  await db
    .insert(schema.notifyRequests)
    .values({ moduleSlug: data.moduleSlug, userId: user?.id ?? null, email: user ? (user.email ?? null) : data.email!.toLowerCase() })
    .onConflictDoNothing();
  return json({ ok: true });
}
