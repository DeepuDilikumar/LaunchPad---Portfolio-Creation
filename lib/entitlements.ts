import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { getCatalogModule } from "@/content/catalog";
import { getDb, schema } from "@/lib/db";
import type { SessionUser } from "@/lib/auth/session";

export type Scope = "all" | "review" | `project:${string}`;

export async function activeScopes(userId: string): Promise<Set<string>> {
  const db = await getDb();
  const rows = await db
    .select({ scope: schema.entitlements.scope })
    .from(schema.entitlements)
    .where(and(eq(schema.entitlements.userId, userId), isNull(schema.entitlements.revokedAt)));
  return new Set(rows.map((r) => r.scope));
}

export function scopesAllow(scopes: Set<string>, project: string) {
  return scopes.has("all") || scopes.has(`project:${project}`);
}

/**
 * The one access check. Used by pages, API routes and the MDX renderer.
 * Free modules are readable by anyone (including logged-out visitors).
 */
export async function canAccess(user: Pick<SessionUser, "id" | "isAdmin"> | null, project: string, module: string): Promise<boolean> {
  const m = getCatalogModule(project, module);
  if (!m) return false;
  if (m.free) return true;
  if (!user) return false;
  if (user.isAdmin) return true;
  return scopesAllow(await activeScopes(user.id), project);
}

export async function hasProjectAccess(user: Pick<SessionUser, "id" | "isAdmin"> | null, project: string) {
  if (!user) return false;
  if (user.isAdmin) return true;
  return scopesAllow(await activeScopes(user.id), project);
}

export async function isPro(userId: string) {
  const scopes = await activeScopes(userId);
  return [...scopes].some((s) => s === "all" || s.startsWith("project:"));
}

/** Idempotent grant: the unique index on (user, scope, source, source_id) absorbs duplicates. */
export async function grantEntitlement(
  db: Awaited<ReturnType<typeof getDb>>,
  input: { userId: string; scope: Scope; source: "purchase" | "coupon" | "admin"; sourceId: string },
) {
  await db.insert(schema.entitlements).values(input).onConflictDoNothing();
  // An admin re-grant clears an earlier revocation. Purchases never un-revoke here:
  // a late duplicate webhook after a refund must not restore access.
  if (input.source !== "admin") return;
  await db
    .update(schema.entitlements)
    .set({ revokedAt: null })
    .where(
      and(
        eq(schema.entitlements.userId, input.userId),
        eq(schema.entitlements.scope, input.scope),
        eq(schema.entitlements.source, input.source),
        eq(schema.entitlements.sourceId, input.sourceId),
      ),
    );
}

export async function revokeEntitlements(
  db: Awaited<ReturnType<typeof getDb>>,
  input: { userId?: string; source: string; sourceId: string; scope?: string },
) {
  const conds = [eq(schema.entitlements.source, input.source), eq(schema.entitlements.sourceId, input.sourceId)];
  if (input.userId) conds.push(eq(schema.entitlements.userId, input.userId));
  if (input.scope) conds.push(eq(schema.entitlements.scope, input.scope));
  await db
    .update(schema.entitlements)
    .set({ revokedAt: new Date() })
    .where(and(...conds, isNull(schema.entitlements.revokedAt)));
}
