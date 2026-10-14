/** Roadmap progress, kept in the browser. Pure functions so they can be tested. */

export const PROGRESS_KEY = "sq.roadmap.sd.v1";

export type TopicStatus = "not_started" | "revising" | "ready" | "skipping";
export type PathMode = "minimum" | "all";

export interface Plan {
  days: 7 | 14 | 30;
  /** First day of the plan, YYYY-MM-DD. */
  start: string;
  /** Optional interview date, YYYY-MM-DD. */
  interview?: string;
}

export interface Progress {
  status: Record<string, TopicStatus>;
  checks: Record<string, number[]>;
  path: PathMode;
  plan: Plan | null;
}

export const emptyProgress = (): Progress => ({ status: {}, checks: {}, path: "all", plan: null });

export function parseProgress(raw: string | null | undefined): Progress {
  if (!raw) return emptyProgress();
  try {
    const p = JSON.parse(raw) as Partial<Progress>;
    const status: Record<string, TopicStatus> = {};
    for (const [k, v] of Object.entries(p.status ?? {})) {
      if (v === "not_started" || v === "revising" || v === "ready" || v === "skipping")
        status[k] = v;
    }
    const checks: Record<string, number[]> = {};
    for (const [k, v] of Object.entries(p.checks ?? {}))
      if (Array.isArray(v)) checks[k] = v.filter((n) => Number.isInteger(n));
    const plan =
      p.plan && [7, 14, 30].includes(p.plan.days) && /^\d{4}-\d{2}-\d{2}$/.test(p.plan.start)
        ? p.plan
        : null;
    return { status, checks, path: p.path === "minimum" ? "minimum" : "all", plan };
  } catch {
    return emptyProgress();
  }
}

export function setStatus(p: Progress, topicId: string, status: TopicStatus): Progress {
  const next = { ...p.status };
  if (status === "not_started") delete next[topicId];
  else next[topicId] = status;
  return { ...p, status: next };
}

export function toggleCheck(p: Progress, topicId: string, index: number): Progress {
  const cur = new Set(p.checks[topicId] ?? []);
  if (cur.has(index)) cur.delete(index);
  else cur.add(index);
  return { ...p, checks: { ...p.checks, [topicId]: [...cur].sort((a, b) => a - b) } };
}

export function statusOf(p: Progress, topicId: string): TopicStatus {
  return p.status[topicId] ?? "not_started";
}

export interface Tally {
  ready: number;
  total: number;
  /** Ready topics counting revising as half: a rough readiness percentage. */
  readiness: number;
}

export function tally(p: Progress, topicIds: string[]): Tally {
  const considered = topicIds.filter((id) => statusOf(p, id) !== "skipping");
  const ready = considered.filter((id) => statusOf(p, id) === "ready").length;
  const revising = considered.filter((id) => statusOf(p, id) === "revising").length;
  const readiness = considered.length
    ? Math.round(((ready + revising * 0.5) / considered.length) * 100)
    : 0;
  return { ready, total: topicIds.length, readiness };
}

/** Encodes progress for a "restore on another device" link. */
export function encodeProgress(p: Progress): string {
  const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(p))));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeProgress(s: string): Progress | null {
  try {
    const json = decodeURIComponent(escape(atob(s.replace(/-/g, "+").replace(/_/g, "/"))));
    return parseProgress(json);
  } catch {
    return null;
  }
}

/** Merge two progress records; the more advanced status wins. */
export function mergeProgress(a: Progress, b: Progress): Progress {
  const rank: Record<TopicStatus, number> = { not_started: 0, skipping: 1, revising: 2, ready: 3 };
  const status = { ...a.status };
  for (const [k, v] of Object.entries(b.status))
    if (rank[v] > rank[status[k] ?? "not_started"]) status[k] = v;
  const checks = { ...a.checks };
  for (const [k, v] of Object.entries(b.checks))
    checks[k] = [...new Set([...(checks[k] ?? []), ...v])].sort((x, y) => x - y);
  return { status, checks, path: a.path, plan: a.plan ?? b.plan };
}
