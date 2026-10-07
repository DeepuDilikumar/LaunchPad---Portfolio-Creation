import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth/session";
import { canAccess } from "@/lib/entitlements";
import { getModule } from "@/lib/content";
import { error, json, parseBody } from "@/lib/http";
import { upsertDecision } from "@/lib/progress-store";
import { getDb, schema } from "@/lib/db";
import { maybeModuleCompleted } from "@/lib/milestones";

const body = z.object({
  project: z.string().max(40),
  module: z.string().max(80),
  cellId: z.string().max(80),
  text: z.string().max(4000),
  isPublic: z.boolean(),
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return error(401, "Sign in to save your decisions.");
  const [data, bad] = await parseBody(req, body);
  if (bad) return bad;
  if (!(await canAccess(user, data.project, data.module))) return error(403, "This module isn't unlocked on your account.");
  const cell = getModule(data.project, data.module)?.cells.find((c) => c.id === data.cellId);
  if (!cell || cell.kind !== "Decision") return error(404, "That decision cell doesn't exist in this module.");
  await upsertDecision({ userId: user.id, ...data });
  await maybeModuleCompleted(user, data.project, data.module);
  return json({ ok: true });
}

const patch = z.object({ id: z.string().uuid(), isPublic: z.boolean().optional(), featured: z.boolean().optional() });

/** Journal toggles: public/private per entry. */
export async function PATCH(req: Request) {
  const user = await getSessionUser();
  if (!user) return error(401, "Sign in first.");
  const [data, bad] = await parseBody(req, patch);
  if (bad) return bad;
  const db = await getDb();
  const set: { isPublic?: boolean; featured?: boolean } = {};
  if (data.isPublic !== undefined) set.isPublic = data.isPublic;
  if (data.featured !== undefined) set.featured = data.featured;
  const res = await db
    .update(schema.decisions)
    .set(set)
    .where(and(eq(schema.decisions.id, data.id), eq(schema.decisions.userId, user.id)))
    .returning({ id: schema.decisions.id });
  if (!res.length) return error(404, "That entry isn't in your journal.");
  return json({ ok: true });
}
