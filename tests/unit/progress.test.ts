import { describe, expect, it } from "vitest";
import { moduleProgress, projectComplete, streakDays, DECISION_MIN_CHARS } from "@/lib/progress";

const req = { requiredCheckpoints: ["a", "b"], decisions: ["d1"] };

describe("moduleProgress", () => {
  it("is complete only when required checkpoints pass and decisions reach the minimum", () => {
    expect(moduleProgress(req, { checkpoints: { a: "passed" }, decisions: {} }).complete).toBe(false);
    expect(moduleProgress(req, { checkpoints: { a: "passed", b: "passed" }, decisions: { d1: DECISION_MIN_CHARS - 1 } }).complete).toBe(false);
    const p = moduleProgress(req, { checkpoints: { a: "passed", b: "passed" }, decisions: { d1: DECISION_MIN_CHARS } });
    expect(p).toMatchObject({ complete: true, done: 3, total: 3, ratio: 1 });
  });
  it("does not count skipped checkpoints", () => {
    expect(moduleProgress(req, { checkpoints: { a: "skipped", b: "passed" }, decisions: { d1: 99 } }).complete).toBe(false);
  });
  it("a module with no requirements is never complete", () => {
    expect(moduleProgress({ requiredCheckpoints: [], decisions: [] }, { checkpoints: {}, decisions: {} }).complete).toBe(false);
  });
});

describe("projectComplete", () => {
  it("ignores outline modules", () => {
    const mods = [
      { ...req, status: "published" },
      { requiredCheckpoints: ["x"], decisions: [], status: "outline" },
    ];
    expect(projectComplete(mods, { checkpoints: { a: "passed", b: "passed" }, decisions: { d1: 50 } })).toBe(true);
  });
});

describe("streakDays", () => {
  const now = new Date("2026-10-07T12:00:00Z");
  const d = (s: string) => new Date(`${s}T10:00:00Z`);
  it("counts consecutive days ending today or yesterday", () => {
    expect(streakDays([d("2026-10-07"), d("2026-10-06"), d("2026-10-05"), d("2026-10-03")], now)).toBe(3);
    expect(streakDays([d("2026-10-06"), d("2026-10-05")], now)).toBe(2);
    expect(streakDays([d("2026-10-04")], now)).toBe(0);
    expect(streakDays([], now)).toBe(0);
  });
});
