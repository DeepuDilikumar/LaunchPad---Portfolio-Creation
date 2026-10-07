/** Pure progress rules, shared by server and client. */

export const DECISION_MIN_CHARS = 40;

export interface ProgressState {
  /** cellId → checkpoint status */
  checkpoints: Record<string, "passed" | "skipped" | undefined>;
  /** cellId → decision text length */
  decisions: Record<string, number | undefined>;
}

export interface ModuleRequirements {
  requiredCheckpoints: string[];
  decisions: string[];
}

export function moduleProgress(req: ModuleRequirements, state: ProgressState) {
  const cpDone = req.requiredCheckpoints.filter((id) => state.checkpoints[id] === "passed").length;
  const decDone = req.decisions.filter((id) => (state.decisions[id] ?? 0) >= DECISION_MIN_CHARS).length;
  const total = req.requiredCheckpoints.length + req.decisions.length;
  const done = cpDone + decDone;
  return {
    done,
    total,
    ratio: total === 0 ? 0 : done / total,
    complete: total > 0 && done === total,
    checkpointsDone: cpDone,
    decisionsDone: decDone,
  };
}

export function projectComplete(modules: (ModuleRequirements & { status: string })[], state: ProgressState): boolean {
  const published = modules.filter((m) => m.status === "published");
  return published.length > 0 && published.every((m) => moduleProgress(m, state).complete);
}

/** Streak = consecutive days (ending today or yesterday) with at least one passed checkpoint. */
export function streakDays(passedDates: Date[], now = new Date()): number {
  const days = new Set(passedDates.map((d) => d.toISOString().slice(0, 10)));
  const day = (offset: number) => new Date(now.getTime() - offset * 86_400_000).toISOString().slice(0, 10);
  const start = days.has(day(0)) ? 0 : days.has(day(1)) ? 1 : -1;
  if (start < 0) return 0;
  let n = 0;
  while (days.has(day(start + n))) n++;
  return n;
}
