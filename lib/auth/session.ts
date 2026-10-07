import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { env, mock, assertProductionSafe } from "@/lib/env";
import { getDb, schema } from "@/lib/db";

export const SESSION_COOKIE = "bp_session";
export const FLAG_COOKIE = "bp_auth";

export type Profile = typeof schema.profiles.$inferSelect;

export interface SessionUser {
  id: string;
  email: string | null;
  profile: Profile;
  isAdmin: boolean;
}

function sign(value: string) {
  return createHmac("sha256", env.authSecret).update(value).digest("base64url");
}

export function makeSessionToken(userId: string) {
  const issued = Date.now().toString(36);
  const body = `${userId}.${issued}`;
  return `${body}.${sign(body)}`;
}

export function readSessionToken(token: string | undefined): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [id, issued, sig] = parts as [string, string, string];
  const expected = sign(`${id}.${issued}`);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const age = Date.now() - parseInt(issued, 36);
  if (!Number.isFinite(age) || age > 1000 * 60 * 60 * 24 * 30) return null;
  return /^[0-9a-f-]{36}$/.test(id) ? id : null;
}

async function supabaseUserId(): Promise<{ id: string; email: string | null; meta: Record<string, unknown> } | null> {
  const { createSupabaseServerClient } = await import("./supabase");
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  return { id: data.user.id, email: data.user.email ?? null, meta: data.user.user_metadata ?? {} };
}

/** The signed-in user (with profile), or null. Cached per request. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  assertProductionSafe();
  let identity: { id: string; email: string | null; meta?: Record<string, unknown> } | null = null;
  if (mock.auth) {
    const store = await cookies();
    const id = readSessionToken(store.get(SESSION_COOKIE)?.value);
    if (id) identity = { id, email: null };
  } else {
    identity = await supabaseUserId();
  }
  if (!identity) return null;
  const db = await getDb();
  let [profile] = await db.select().from(schema.profiles).where(eq(schema.profiles.userId, identity.id)).limit(1);
  if (!profile) {
    if (mock.auth) return null; // stale cookie for a user that no longer exists
    const { ensureProfile } = await import("./profiles");
    profile = await ensureProfile({
      userId: identity.id,
      email: identity.email,
      name: String(identity.meta?.full_name ?? identity.meta?.name ?? ""),
      githubUsername: identity.meta?.user_name ? String(identity.meta.user_name) : null,
      avatarUrl: identity.meta?.avatar_url ? String(identity.meta.avatar_url) : null,
    });
  }
  return { id: identity.id, email: profile.email ?? identity.email, profile, isAdmin: profile.role === "admin" };
});

export async function requireUser(next = "/dashboard"): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    const { redirect } = await import("next/navigation");
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }
  return user!;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser("/admin");
  if (!user.isAdmin) {
    const { notFound } = await import("next/navigation");
    notFound();
  }
  return user;
}
