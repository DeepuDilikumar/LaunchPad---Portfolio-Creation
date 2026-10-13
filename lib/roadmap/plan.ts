/** Splits the roadmap's topics across a 7, 14 or 30-day plan, keeping map order. */

export interface PlanDay {
  day: number;
  date: string;
  topicIds: string[];
  /** The last two days of 14 and 30-day plans are for mock designs and revision. */
  kind: "learn" | "mock" | "revise";
}

export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function buildPlan(topicIds: string[], days: number, start: string): PlanDay[] {
  const spare = days >= 14 ? 2 : 0;
  const learnDays = Math.max(1, days - spare);
  const out: PlanDay[] = [];
  let i = 0;
  for (let d = 0; d < learnDays; d++) {
    const remainingDays = learnDays - d;
    const take = Math.ceil((topicIds.length - i) / remainingDays);
    out.push({
      day: d + 1,
      date: addDays(start, d),
      topicIds: topicIds.slice(i, i + take),
      kind: "learn",
    });
    i += take;
  }
  if (spare) {
    out.push({ day: learnDays + 1, date: addDays(start, learnDays), topicIds: [], kind: "mock" });
    out.push({
      day: learnDays + 2,
      date: addDays(start, learnDays + 1),
      topicIds: [],
      kind: "revise",
    });
  }
  return out;
}

/** 1-based day number for `today`, clamped to the plan. */
export function dayNumber(start: string, today: string, days: number): number {
  const diff = Math.round(
    (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86400_000,
  );
  return Math.min(days, Math.max(1, diff + 1));
}
