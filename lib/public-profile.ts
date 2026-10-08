import "server-only";
import { and, desc, eq, isNotNull } from "drizzle-orm";
import { cache } from "react";
import { getDb, schema } from "@/lib/db";
import { isVerified, publicDecisionsFor } from "@/lib/proof";

export const getPublicProfile = cache(async (handle: string) => {
  const db = await getDb();
  const [profile] = await db.select().from(schema.profiles).where(eq(schema.profiles.handle, handle.toLowerCase())).limit(1);
  if (!profile) return null;
  const packs = await db
    .select()
    .from(schema.proofPacks)
    .where(and(eq(schema.proofPacks.userId, profile.userId), isNotNull(schema.proofPacks.publishedAt)))
    .orderBy(desc(schema.proofPacks.publishedAt));
  const decisions = await db
    .select()
    .from(schema.decisions)
    .where(and(eq(schema.decisions.userId, profile.userId), eq(schema.decisions.isPublic, true)))
    .orderBy(desc(schema.decisions.featured), desc(schema.decisions.updatedAt));
  return {
    profile,
    packs: packs.map((p) => ({ ...p, verified: isVerified(p) })),
    decisions,
  };
});

export async function getPublicPack(handle: string, project: string) {
  const data = await getPublicProfile(handle);
  if (!data) return null;
  const pack = data.packs.find((p) => p.project === project);
  if (!pack) return null;
  const featured = await publicDecisionsFor(data.profile.userId, pack.featuredDecisionIds);
  return { ...data, pack, featured };
}
