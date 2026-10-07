import "server-only";
import { eq, like } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

export function handleBase(email: string | null, name?: string) {
  const raw = (name || email?.split("@")[0] || "learner").toLowerCase();
  const base = raw.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 24);
  return base.length >= 3 ? base : `learner-${base}`.replace(/-+$/, "");
}

export const RESERVED_HANDLES = new Set(["admin", "api", "dashboard", "login", "settings", "proof", "journal", "learn", "u", "sample", "support", "help"]);

export async function uniqueHandle(base: string): Promise<string> {
  const db = await getDb();
  const taken = new Set(
    (await db.select({ h: schema.profiles.handle }).from(schema.profiles).where(like(schema.profiles.handle, `${base}%`))).map((r) => r.h),
  );
  if (!taken.has(base) && !RESERVED_HANDLES.has(base)) return base;
  for (let i = 2; i < 10_000; i++) {
    const h = `${base}-${i}`;
    if (!taken.has(h)) return h;
  }
  return `${base}-${Date.now().toString(36)}`;
}

export async function ensureProfile(input: {
  userId: string;
  email: string | null;
  name?: string;
  githubUsername?: string | null;
  avatarUrl?: string | null;
}) {
  const db = await getDb();
  const [existing] = await db.select().from(schema.profiles).where(eq(schema.profiles.userId, input.userId)).limit(1);
  if (existing) return existing;
  const handle = await uniqueHandle(handleBase(input.email, input.githubUsername ?? undefined));
  const [created] = await db
    .insert(schema.profiles)
    .values({
      userId: input.userId,
      email: input.email,
      handle,
      name: input.name ?? "",
      githubUsername: input.githubUsername ?? null,
      avatarUrl: input.avatarUrl ?? null,
    })
    .onConflictDoNothing()
    .returning();
  if (created) return created;
  const [again] = await db.select().from(schema.profiles).where(eq(schema.profiles.userId, input.userId)).limit(1);
  return again!;
}
