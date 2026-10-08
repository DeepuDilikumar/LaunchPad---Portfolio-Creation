import { and, eq, gte, lte, notInArray, sql } from "drizzle-orm";
import { env, isProduction } from "@/lib/env";
import { getDb, schema } from "@/lib/db";
import { sendEmail } from "@/lib/email";

/**
 * Vercel Cron (see vercel.json): email learners who signed up 24–48h ago and haven't passed
 * a checkpoint yet. Each learner gets this nudge at most once.
 */
export async function GET(req: Request) {
  if (isProduction && !env.cronSecret) return new Response("Unauthorized", { status: 401 });
  if (env.cronSecret && req.headers.get("authorization") !== `Bearer ${env.cronSecret}`) return new Response("Unauthorized", { status: 401 });
  const db = await getDb();
  const now = Date.now();
  const passed = db.select({ id: schema.progress.userId }).from(schema.progress).where(and(eq(schema.progress.kind, "checkpoint"), eq(schema.progress.status, "passed")));
  const nudged = db.select({ id: sql<string>`${schema.emailLog.userId}` }).from(schema.emailLog).where(eq(schema.emailLog.template, "first_checkpoint_nudge"));
  const due = await db
    .select()
    .from(schema.profiles)
    .where(
      and(
        lte(schema.profiles.createdAt, new Date(now - 24 * 3600_000)),
        gte(schema.profiles.createdAt, new Date(now - 48 * 3600_000)),
        eq(schema.profiles.marketingEmails, true),
        notInArray(schema.profiles.userId, passed),
        notInArray(schema.profiles.userId, nudged),
      ),
    )
    .limit(500);
  let sent = 0;
  for (const p of due) {
    if (!p.email) continue;
    await sendEmail({ to: p.email, userId: p.userId, template: "first_checkpoint_nudge", data: { name: p.name } });
    sent++;
  }
  return Response.json({ sent });
}
