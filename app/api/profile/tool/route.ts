import { z } from "zod";
import { eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth/session";
import { error, json, parseBody } from "@/lib/http";
import { getDb, schema } from "@/lib/db";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return error(401, "Sign in first.");
  const [data, bad] = await parseBody(req, z.object({ tool: z.enum(["claude", "codex", "cursor"]) }));
  if (bad) return bad;
  const db = await getDb();
  await db.update(schema.profiles).set({ preferredTool: data.tool }).where(eq(schema.profiles.userId, user.id));
  return json({ ok: true });
}
