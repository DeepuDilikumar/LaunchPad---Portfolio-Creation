import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth/session";
import { error, json, parseBody } from "@/lib/http";
import { getDb, schema } from "@/lib/db";
import { getProject } from "@/content/catalog";
import { isProjectComplete } from "@/lib/milestones";
import { getOrCreateProofPack, isVerified } from "@/lib/proof";
import { recordEvent } from "@/lib/analytics/server";
import { sendEmail } from "@/lib/email";
import { env } from "@/lib/env";

const url = z
  .string()
  .trim()
  .max(300)
  .url()
  .refine((u) => /^https?:\/\//i.test(u), "Use an http or https URL.")
  .or(z.literal(""));

const body = z.object({
  repoUrl: url.optional(),
  liveUrl: url.optional(),
  metrics: z.array(z.object({ label: z.string().trim().min(1).max(60), value: z.string().trim().min(1).max(60) })).max(8).optional(),
  featuredDecisionIds: z.array(z.string().uuid()).max(3).optional(),
  caseStudyMd: z.string().max(12_000).optional(),
  bullets: z.array(z.string().trim().min(1).max(300)).max(5).optional(),
  architecture: z.string().max(4000).optional(),
  publish: z.boolean().optional(),
  unpublish: z.boolean().optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ project: string }> }) {
  const { project } = await params;
  const user = await getSessionUser();
  if (!user) return error(401, "Sign in first.");
  const p = getProject(project);
  if (!p || p.kind !== "project") return error(404, "Unknown project.");
  if (!user.isAdmin && !(await isProjectComplete(user.id, project))) return error(403, "Finish every published module in this project to unlock its proof pack.");
  const [data, bad] = await parseBody(req, body);
  if (bad) return bad;
  const pack = await getOrCreateProofPack(user.id, project);
  const db = await getDb();

  if (data.featuredDecisionIds?.length) {
    const own = await db.select({ id: schema.decisions.id, isPublic: schema.decisions.isPublic, project: schema.decisions.project }).from(schema.decisions).where(eq(schema.decisions.userId, user.id));
    const ok = data.featuredDecisionIds.every((id) => own.some((d) => d.id === id && d.isPublic && d.project === project));
    if (!ok) return error(400, "Featured decisions must be your own public decisions from this project.");
  }

  const changedTarget = (data.repoUrl !== undefined && data.repoUrl !== (pack.repoUrl ?? "")) || (data.liveUrl !== undefined && data.liveUrl !== (pack.liveUrl ?? ""));
  const set: Partial<typeof schema.proofPacks.$inferInsert> = { updatedAt: new Date() };
  if (data.repoUrl !== undefined) set.repoUrl = data.repoUrl || null;
  if (data.liveUrl !== undefined) set.liveUrl = data.liveUrl || null;
  // Changing the repo or URL invalidates the earlier verification.
  if (changedTarget) {
    set.checks = {};
    set.verifiedAt = null;
  }
  if (data.metrics) set.metrics = data.metrics;
  if (data.featuredDecisionIds) set.featuredDecisionIds = data.featuredDecisionIds;
  if (data.caseStudyMd !== undefined) set.caseStudyMd = data.caseStudyMd;
  if (data.bullets) set.bullets = data.bullets;
  if (data.architecture !== undefined) set.architecture = data.architecture || null;
  const firstPublish = data.publish && !pack.publishedAt;
  if (data.publish) {
    const next = { ...pack, ...set };
    if (!next.repoUrl || !next.liveUrl) return error(400, "Add your repo and live URL before publishing.");
    if (!next.caseStudyMd?.trim()) return error(400, "Write or generate a case study before publishing.");
    set.publishedAt = pack.publishedAt ?? new Date();
  }
  if (data.unpublish) set.publishedAt = null;
  const [saved] = await db.update(schema.proofPacks).set(set).where(and(eq(schema.proofPacks.userId, user.id), eq(schema.proofPacks.project, project))).returning();

  if (firstPublish) {
    await recordEvent("proof_published", user.id, { project });
    if (user.email) {
      await sendEmail({ to: user.email, userId: user.id, template: "proof_published", data: { name: user.profile.name, project: p.name, url: `${env.siteUrl}/u/${user.profile.handle}/${project}` } });
    }
  }
  return json({ ok: true, publishedAt: saved?.publishedAt ?? null, verified: saved ? isVerified(saved) : false, url: `/u/${user.profile.handle}/${project}` });
}
