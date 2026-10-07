import "server-only";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getProject } from "@/content/catalog";
import { projectSummaries } from "@/lib/content";
import { moduleProgress } from "@/lib/progress";
import { getUserProgress, toProgressState } from "@/lib/progress-store";
import { recordEvent } from "@/lib/analytics/server";
import { sendEmail } from "@/lib/email";
import type { SessionUser } from "@/lib/auth/session";

const MARK = "__complete";

async function markOnce(userId: string, project: string, module: string): Promise<boolean> {
  const db = await getDb();
  const res = await db
    .insert(schema.progress)
    .values({ userId, project, module, cellId: MARK, kind: "milestone", status: "complete" })
    .onConflictDoNothing()
    .returning({ id: schema.progress.id });
  return res.length > 0;
}

/** After a checkpoint or decision save: record module/project completion exactly once. */
export async function maybeModuleCompleted(user: SessionUser, project: string, module: string) {
  try {
    const summaries = projectSummaries(project);
    const summary = summaries.find((m) => m.slug === module);
    if (!summary) return;
    const { rows, decisions } = await getUserProgress(user.id);
    const p = moduleProgress(summary, toProgressState(rows, decisions, project, module));
    if (!p.complete) return;
    if (!(await markOnce(user.id, project, module))) return;
    await recordEvent("module_completed", user.id, { project, module });
    const proj = getProject(project);
    if (user.email && proj) {
      await sendEmail({
        to: user.email,
        userId: user.id,
        template: "module_complete",
        data: { name: user.profile.name, project: proj.name, module: summary.title, projectSlug: project },
      });
    }
    const states = Object.fromEntries(summaries.map((m) => [m.slug, toProgressState(rows, decisions, project, m.slug)]));
    const all = summaries.filter((m) => m.status === "published");
    const allDone = all.length > 0 && all.every((m) => moduleProgress(m, states[m.slug]!).complete);
    if (allDone) {
      if (await markOnce(user.id, project, "__project")) await recordEvent("project_completed", user.id, { project });
    }
  } catch (e) {
    console.error("[milestones]", e);
  }
}

export async function isProjectComplete(userId: string, project: string) {
  const summaries = projectSummaries(project).filter((m) => m.status === "published");
  if (!summaries.length) return false;
  const { rows, decisions } = await getUserProgress(userId);
  return summaries.every((m) => moduleProgress(m, toProgressState(rows, decisions, project, m.slug)).complete);
}

export async function hasMilestone(userId: string, project: string, module: string) {
  const db = await getDb();
  const r = await db
    .select({ id: schema.progress.id })
    .from(schema.progress)
    .where(and(eq(schema.progress.userId, userId), eq(schema.progress.project, project), eq(schema.progress.module, module), eq(schema.progress.cellId, MARK)))
    .limit(1);
  return r.length > 0;
}
