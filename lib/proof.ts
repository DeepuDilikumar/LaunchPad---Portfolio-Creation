import "server-only";
import { randomBytes } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { allPassed, type Checks } from "@/lib/verify";

export type ProofPack = typeof schema.proofPacks.$inferSelect;

export async function getOrCreateProofPack(userId: string, project: string): Promise<ProofPack> {
  const db = await getDb();
  const [existing] = await db.select().from(schema.proofPacks).where(and(eq(schema.proofPacks.userId, userId), eq(schema.proofPacks.project, project))).limit(1);
  if (existing) return existing;
  await db.insert(schema.proofPacks).values({ userId, project, verifyToken: `bp_${randomBytes(12).toString("hex")}` }).onConflictDoNothing();
  const [created] = await db.select().from(schema.proofPacks).where(and(eq(schema.proofPacks.userId, userId), eq(schema.proofPacks.project, project))).limit(1);
  return created!;
}

/** A pack shows the "Verified build" badge only when every stored check passed. */
export function isVerified(p: Pick<ProofPack, "checks" | "verifiedAt">) {
  return !!p.verifiedAt && allPassed(p.checks as Partial<Checks>);
}

export async function publicDecisionsFor(userId: string, ids: string[]) {
  if (!ids.length) return [];
  const db = await getDb();
  const rows = await db
    .select()
    .from(schema.decisions)
    .where(and(eq(schema.decisions.userId, userId), inArray(schema.decisions.id, ids), eq(schema.decisions.isPublic, true)));
  return ids.map((id) => rows.find((r) => r.id === id)).filter((r): r is NonNullable<typeof r> => !!r);
}
