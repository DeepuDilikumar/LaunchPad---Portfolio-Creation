import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { canAccess } from "@/lib/entitlements";
import { getModule } from "@/lib/content";
import { error, json, parseBody } from "@/lib/http";
import { upsertProgress } from "@/lib/progress-store";
import { recordEvent } from "@/lib/analytics/server";
import { maybeModuleCompleted } from "@/lib/milestones";

const body = z.object({
  project: z.string().max(40),
  module: z.string().max(80),
  cellId: z.string().max(80),
  kind: z.enum(["checkpoint", "touch"]),
  status: z.enum(["passed", "skipped"]).optional(),
  output: z.string().max(4000).optional(),
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return error(401, "Sign in to save your progress.");
  const [data, bad] = await parseBody(req, body);
  if (bad) return bad;
  if (!(await canAccess(user, data.project, data.module))) return error(403, "This module isn't unlocked on your account.");
  const mod = getModule(data.project, data.module);
  const cell = mod?.cells.find((c) => c.id === data.cellId);
  if (!cell) return error(404, "That cell doesn't exist in this module.");

  if (data.kind === "touch") {
    await upsertProgress({ userId: user.id, project: data.project, module: data.module, cellId: data.cellId, kind: "touch", status: "touched" });
    return json({ ok: true });
  }
  if (cell.kind !== "Checkpoint") return error(400, "Only checkpoint cells can be marked passed.");
  if (data.status === "skipped" && cell.required) return error(400, "Required checkpoints can't be skipped.");
  const status = data.status ?? "passed";
  await upsertProgress({
    userId: user.id,
    project: data.project,
    module: data.module,
    cellId: data.cellId,
    kind: "checkpoint",
    status,
    payload: { ...(data.output ? { output: data.output } : {}), ...(status === "passed" ? { passedAt: new Date().toISOString() } : {}) },
  });
  if (status === "passed") {
    await recordEvent("checkpoint_passed", user.id, { project: data.project, module: data.module });
    await maybeModuleCompleted(user, data.project, data.module);
  }
  return json({ ok: true });
}
