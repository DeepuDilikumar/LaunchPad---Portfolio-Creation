import { and, eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth/session";
import { error, json } from "@/lib/http";
import { getDb, schema } from "@/lib/db";
import { getProject } from "@/content/catalog";
import { isProjectComplete } from "@/lib/milestones";
import { getOrCreateProofPack } from "@/lib/proof";
import { allPassed, runVerification } from "@/lib/verify";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(_req: Request, { params }: { params: Promise<{ project: string }> }) {
  const { project } = await params;
  const user = await getSessionUser();
  if (!user) return error(401, "Sign in first.");
  if (!getProject(project) || getProject(project)!.kind !== "project") return error(404, "Unknown project.");
  if (!user.isAdmin && !(await isProjectComplete(user.id, project))) return error(403, "Finish the project first.");
  const rl = await rateLimit(`verify:${user.id}`, 10, 3600);
  if (!rl.ok) return error(429, `You've run verification a lot this hour. Try again after ${new Date(rl.resetAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}.`);
  const pack = await getOrCreateProofPack(user.id, project);
  if (!pack.repoUrl || !pack.liveUrl) return error(400, "Save your repo URL and live URL first.");
  const checks = await runVerification({ repoUrl: pack.repoUrl, liveUrl: pack.liveUrl, token: pack.verifyToken, githubUsername: user.profile.githubUsername });
  const passed = allPassed(checks);
  const db = await getDb();
  await db
    .update(schema.proofPacks)
    .set({ checks, verifiedAt: passed ? new Date() : null, updatedAt: new Date() })
    .where(and(eq(schema.proofPacks.userId, user.id), eq(schema.proofPacks.project, project)));
  return json({ checks, verified: passed });
}
