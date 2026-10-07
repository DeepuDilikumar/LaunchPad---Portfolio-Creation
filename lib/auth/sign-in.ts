import "server-only";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { ensureProfile } from "./profiles";
import { FLAG_COOKIE, SESSION_COOKIE, makeSessionToken } from "./session";
import { recordEvent } from "@/lib/analytics/server";
import { sendEmail } from "@/lib/email";

const secure = process.env.NODE_ENV === "production";

export async function setFlagCookie(on: boolean) {
  const store = await cookies();
  if (on) store.set(FLAG_COOKIE, "1", { path: "/", sameSite: "lax", secure, maxAge: 60 * 60 * 24 * 30 });
  else store.delete(FLAG_COOKIE);
}

/** Called after any successful sign-in (mock or Supabase). Returns whether this was a new account. */
export async function afterSignIn(userId: string, email: string | null, meta: { name?: string; githubUsername?: string | null; avatarUrl?: string | null } = {}) {
  const db = await getDb();
  const [before] = await db.select({ id: schema.profiles.userId }).from(schema.profiles).where(eq(schema.profiles.userId, userId)).limit(1);
  const profile = await ensureProfile({ userId, email, ...meta });
  const isNew = !before;
  if (isNew) {
    await recordEvent("signup_completed", userId, {});
    if (email) await sendEmail({ to: email, userId, template: "welcome", data: { name: profile.name } });
  }
  await setFlagCookie(true);
  return { profile, isNew };
}

/** Mock auth only: find or create a user by email and set the signed session cookie. */
export async function mockSignIn(email: string, meta: { name?: string; githubUsername?: string | null } = {}) {
  const db = await getDb();
  const normalized = email.trim().toLowerCase();
  let [user] = await db.select().from(schema.users).where(eq(schema.users.email, normalized)).limit(1);
  if (!user) {
    [user] = await db.insert(schema.users).values({ email: normalized }).onConflictDoNothing().returning();
    if (!user) [user] = await db.select().from(schema.users).where(eq(schema.users.email, normalized)).limit(1);
  }
  const store = await cookies();
  store.set(SESSION_COOKIE, makeSessionToken(user!.id), { path: "/", httpOnly: true, sameSite: "lax", secure, maxAge: 60 * 60 * 24 * 30 });
  return afterSignIn(user!.id, normalized, meta);
}

export async function signOut() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  await setFlagCookie(false);
}
