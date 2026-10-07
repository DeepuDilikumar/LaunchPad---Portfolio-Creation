import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import type { CheckpointState, DecisionState } from "@/components/notebook/context";

export async function getModuleState(userId: string, project: string, module: string) {
  const db = await getDb();
  const [rows, decs] = await Promise.all([
    db
      .select()
      .from(schema.progress)
      .where(and(eq(schema.progress.userId, userId), eq(schema.progress.project, project), eq(schema.progress.module, module))),
    db
      .select()
      .from(schema.decisions)
      .where(and(eq(schema.decisions.userId, userId), eq(schema.decisions.project, project), eq(schema.decisions.module, module))),
  ]);
  const checkpoints: Record<string, CheckpointState> = {};
  let lastCell: string | null = null;
  let lastAt = 0;
  for (const r of rows) {
    if (r.kind === "checkpoint" && (r.status === "passed" || r.status === "skipped")) {
      checkpoints[r.cellId] = { status: r.status, output: typeof r.payload.output === "string" ? r.payload.output : undefined };
    }
    if (r.kind === "milestone") continue;
    const at = r.updatedAt.getTime();
    if (at > lastAt) {
      lastAt = at;
      lastCell = r.cellId;
    }
  }
  const decisions: Record<string, DecisionState> = {};
  for (const d of decs) {
    decisions[d.cellId] = { text: d.text, isPublic: d.isPublic, savedAt: d.updatedAt.toISOString() };
    if (d.updatedAt.getTime() > lastAt) {
      lastAt = d.updatedAt.getTime();
      lastCell = d.cellId;
    }
  }
  return { checkpoints, decisions, lastCell };
}

export async function getUserProgress(userId: string) {
  const db = await getDb();
  const [rows, decs] = await Promise.all([
    db.select().from(schema.progress).where(eq(schema.progress.userId, userId)).orderBy(desc(schema.progress.updatedAt)),
    db.select().from(schema.decisions).where(eq(schema.decisions.userId, userId)).orderBy(desc(schema.decisions.updatedAt)),
  ]);
  return { rows, decisions: decs };
}

/** Keyed "project/module/cell" maps used by moduleProgress(). */
export function toProgressState(rows: (typeof schema.progress.$inferSelect)[], decs: (typeof schema.decisions.$inferSelect)[], project: string, module: string) {
  const checkpoints: Record<string, "passed" | "skipped" | undefined> = {};
  const decisions: Record<string, number | undefined> = {};
  for (const r of rows) if (r.project === project && r.module === module && r.kind === "checkpoint") checkpoints[r.cellId] = r.status as "passed" | "skipped";
  for (const d of decs) if (d.project === project && d.module === module) decisions[d.cellId] = d.text.trim().length;
  return { checkpoints, decisions };
}

export async function upsertProgress(input: {
  userId: string;
  project: string;
  module: string;
  cellId: string;
  kind: string;
  status: string;
  payload?: Record<string, unknown>;
}) {
  const db = await getDb();
  const values = { ...input, payload: input.payload ?? {}, updatedAt: new Date() };
  // A "touch" must never downgrade a passed checkpoint.
  const set =
    input.kind === "touch"
      ? { updatedAt: values.updatedAt }
      : { kind: values.kind, status: values.status, payload: values.payload, updatedAt: values.updatedAt };
  await db
    .insert(schema.progress)
    .values(values)
    .onConflictDoUpdate({
      target: [schema.progress.userId, schema.progress.project, schema.progress.module, schema.progress.cellId],
      set,
    });
}

export async function upsertDecision(input: { userId: string; project: string; module: string; cellId: string; text: string; isPublic: boolean }) {
  const db = await getDb();
  await db
    .insert(schema.decisions)
    .values({ ...input, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: [schema.decisions.userId, schema.decisions.project, schema.decisions.module, schema.decisions.cellId],
      set: { text: input.text, isPublic: input.isPublic, updatedAt: new Date() },
    });
}

export async function firstCheckpointAt(userId: string): Promise<Date | null> {
  const db = await getDb();
  const [r] = await db
    .select({ at: sql<Date>`min(${schema.progress.updatedAt})` })
    .from(schema.progress)
    .where(and(eq(schema.progress.userId, userId), eq(schema.progress.kind, "checkpoint"), eq(schema.progress.status, "passed")));
  return r?.at ? new Date(r.at) : null;
}
