import { getSessionUser } from "@/lib/auth/session";
import { error, json } from "@/lib/http";
import { getProject } from "@/content/catalog";
import { isProjectComplete } from "@/lib/milestones";
import { getOrCreateProofPack, publicDecisionsFor } from "@/lib/proof";
import { generateProofDraft } from "@/lib/ai/generate";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(_req: Request, { params }: { params: Promise<{ project: string }> }) {
  const { project } = await params;
  const user = await getSessionUser();
  if (!user) return error(401, "Sign in first.");
  const p = getProject(project);
  if (!p || p.kind !== "project") return error(404, "Unknown project.");
  if (!user.isAdmin && !(await isProjectComplete(user.id, project))) return error(403, "Finish the project first.");
  const rl = await rateLimit(`generate:${user.id}`, 10, 86_400);
  if (!rl.ok) return error(429, "You've generated 10 drafts today. Edit the current one, or try again tomorrow.");
  const pack = await getOrCreateProofPack(user.id, project);
  const decisions = await publicDecisionsFor(user.id, pack.featuredDecisionIds);
  try {
    const draft = await generateProofDraft({
      projectName: p.name,
      projectTitle: p.title,
      stack: p.stack,
      hardParts: p.hardParts,
      metrics: pack.metrics,
      decisions: decisions.map((d) => d.text),
      repoUrl: pack.repoUrl,
      liveUrl: pack.liveUrl,
    });
    return json(draft);
  } catch (e) {
    console.error("[generate]", e);
    return error(502, "The draft couldn't be generated right now. Try again in a minute.");
  }
}
