import { z } from "zod";
import { and, eq, ne } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth/session";
import { error, json, parseBody } from "@/lib/http";
import { getDb, schema } from "@/lib/db";
import { RESERVED_HANDLES } from "@/lib/auth/profiles";
import { mock } from "@/lib/env";

const body = z.object({
  name: z.string().trim().max(80),
  handle: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$/, "Use 3–30 letters, numbers or dashes."),
  headline: z.string().trim().max(120),
  githubUsername: z
    .string()
    .trim()
    .max(39)
    .regex(/^$|^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,38})$/, "That isn't a valid GitHub username."),
  preferredTool: z.enum(["claude", "codex", "cursor"]),
  isPublic: z.boolean(),
  marketingEmails: z.boolean(),
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return error(401, "Sign in first.");
  const [data, bad] = await parseBody(req, body);
  if (bad) return bad;
  if (RESERVED_HANDLES.has(data.handle) && data.handle !== user.profile.handle) return error(400, "That handle is reserved. Pick another.");
  const db = await getDb();
  const [taken] = await db
    .select({ id: schema.profiles.userId })
    .from(schema.profiles)
    .where(and(eq(schema.profiles.handle, data.handle), ne(schema.profiles.userId, user.id)))
    .limit(1);
  if (taken) return error(409, "That handle is taken. Pick another.");
  const githubUsername = data.githubUsername || null;
  if (!mock.auth && user.profile.githubUsername && githubUsername !== user.profile.githubUsername) {
    return error(400, "Your GitHub username comes from your GitHub sign-in and can't be changed here.");
  }
  await db.update(schema.profiles).set({ ...data, githubUsername }).where(eq(schema.profiles.userId, user.id));
  if ((githubUsername ?? "").toLowerCase() !== (user.profile.githubUsername ?? "").toLowerCase()) {
    // Verification was tied to the old account.
    await db.update(schema.proofPacks).set({ checks: {}, verifiedAt: null }).where(eq(schema.proofPacks.userId, user.id));
  }
  return json({ ok: true });
}
