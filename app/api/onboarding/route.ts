import { z } from "zod";
import { eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth/session";
import { error, json, parseBody } from "@/lib/http";
import { getDb, schema } from "@/lib/db";
import { recordEvent } from "@/lib/analytics/server";

const experienceLevels = ["student", "0-2", "2-5", "5+"] as const;
const targetRoles = ["product", "ai", "backend", "fullstack"] as const;

const body = z.object({
  experienceLevel: z.enum(experienceLevels),
  targetRole: z.enum(targetRoles),
  preferredTool: z.enum(["claude", "codex", "cursor"]),
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return error(401, "Sign in first.");
  const [data, bad] = await parseBody(req, body);
  if (bad) return bad;
  const db = await getDb();
  await db
    .update(schema.profiles)
    .set({ ...data, onboardedAt: user.profile.onboardedAt ?? new Date() })
    .where(eq(schema.profiles.userId, user.id));
  if (!user.profile.onboardedAt) await recordEvent("onboarding_completed", user.id, data);
  return json({ ok: true });
}
