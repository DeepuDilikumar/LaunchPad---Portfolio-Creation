import { describe, expect, it } from "vitest";
import { loadGuide } from "@/lib/content/load";
import { layoutRoadmap, LAYOUT } from "@/lib/roadmap/layout";
import { loadRoadmap, sectionTopicIds } from "@/lib/roadmap/load";
import { buildPlan, dayNumber } from "@/lib/roadmap/plan";
import {
  decodeProgress,
  emptyProgress,
  encodeProgress,
  mergeProgress,
  parseProgress,
  setStatus,
  tally,
  toggleCheck,
} from "@/lib/roadmap/progress";
import { buildRoadmapView, conceptLinks } from "@/lib/roadmap/view";

describe("roadmap content", () => {
  const rm = loadRoadmap("system-design", { fresh: true });

  it("loads with no issues", () => {
    expect(rm.issues).toEqual([]);
  });

  it("places every topic exactly once, in its own section", () => {
    const placed = rm.roadmap.sections.flatMap((s) => sectionTopicIds(s));
    expect(new Set(placed).size).toBe(placed.length);
    expect(placed.sort()).toEqual(rm.topics.map((t) => t.id).sort());
  });

  it("has a why-next phrase for every section after the first", () => {
    for (const s of rm.roadmap.sections.slice(1)) expect(s.why, s.id).toBeTruthy();
  });

  it("keeps summaries to 60 words", () => {
    for (const t of rm.topics) expect(t.summary.split(/\s+/).length, t.id).toBeLessThanOrEqual(60);
  });

  it("only references real guide questions and cloud entries", () => {
    const guide = new Set(loadGuide("backend").questions.map((q) => q.id));
    for (const t of rm.topics) {
      if (t.cloud) expect(rm.cloud.concepts[t.cloud], t.id).toBeTruthy();
      for (const q of t.questions)
        if (q.guide_ref) expect(guide.has(q.guide_ref), q.guide_ref).toBe(true);
    }
  });

  it("guide question concepts all point at roadmap topics", () => {
    const ids = new Set(rm.topics.map((t) => t.id));
    for (const q of loadGuide("backend").questions)
      for (const c of q.concepts ?? []) expect(ids.has(c), `${q.id} → ${c}`).toBe(true);
  });
});

describe("visibility", () => {
  it("hides draft topic content and concept links outside preview mode", () => {
    const prev = process.env.NEXT_PUBLIC_CONTENT_PREVIEW;
    process.env.NEXT_PUBLIC_CONTENT_PREVIEW = "0";
    try {
      const { topics } = buildRoadmapView();
      const drafts = topics.filter((t) => t.draft);
      expect(drafts.length).toBeGreaterThan(0);
      for (const t of drafts) {
        expect(t.visible).toBe(false);
        expect(t.summary).toBe("");
        expect(t.free).toEqual([]);
      }
      expect(conceptLinks(["cache-aside"])).toEqual([]);
    } finally {
      process.env.NEXT_PUBLIC_CONTENT_PREVIEW = prev;
    }
  });

  it("shows drafts in preview mode, with locked questions carrying no answers", () => {
    const prev = process.env.NEXT_PUBLIC_CONTENT_PREVIEW;
    process.env.NEXT_PUBLIC_CONTENT_PREVIEW = "1";
    try {
      const t = buildRoadmapView().topics.find((x) => x.id === "cache-aside")!;
      expect(t.visible).toBe(true);
      expect(t.free[0].moves).toHaveLength(3);
      expect(Object.keys(t.locked[0]).sort()).toEqual(["ctaHref", "ctaLabel", "ref", "text"]);
      expect(conceptLinks(["cache-aside"])[0].href).toBe("/roadmap/system-design/cache-aside");
    } finally {
      process.env.NEXT_PUBLIC_CONTENT_PREVIEW = prev;
    }
  });
});

describe("map layout", () => {
  const layout = layoutRoadmap(loadRoadmap().roadmap);

  it("keeps every box inside the canvas", () => {
    for (const b of [...layout.nodes, ...layout.groups, ...layout.mains]) {
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.x + b.w).toBeLessThanOrEqual(LAYOUT.width);
      expect(b.y + b.h).toBeLessThanOrEqual(layout.height);
    }
  });

  it("puts each why-next phrase between the previous section and its own", () => {
    for (const w of layout.whys) {
      const i = layout.mains.findIndex((m) => m.sectionId === w.sectionId);
      expect(w.y).toBeGreaterThan(layout.mains[i - 1].y);
      expect(w.y).toBeLessThan(layout.mains[i].y);
    }
  });

  it("never overlaps two topic cards", () => {
    const n = layout.nodes;
    for (let i = 0; i < n.length; i++)
      for (let j = i + 1; j < n.length; j++) {
        const a = n[i];
        const b = n[j];
        const overlap = a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
        expect(overlap, `${a.topicId} / ${b.topicId}`).toBe(false);
      }
  });
});

describe("progress", () => {
  it("sets and clears statuses, and tallies readiness", () => {
    let p = setStatus(emptyProgress(), "a", "ready");
    p = setStatus(p, "b", "revising");
    p = setStatus(p, "c", "skipping");
    expect(tally(p, ["a", "b", "c", "d"])).toEqual({ ready: 1, total: 4, readiness: 50 });
    p = setStatus(p, "a", "not_started");
    expect(p.status.a).toBeUndefined();
  });

  it("toggles self-checks", () => {
    let p = toggleCheck(emptyProgress(), "t", 1);
    p = toggleCheck(p, "t", 0);
    expect(p.checks.t).toEqual([0, 1]);
    expect(toggleCheck(p, "t", 1).checks.t).toEqual([0]);
  });

  it("survives junk in storage", () => {
    expect(parseProgress("not json")).toEqual(emptyProgress());
    expect(parseProgress(JSON.stringify({ status: { a: "hacked", b: "ready" } })).status).toEqual({
      b: "ready",
    });
  });

  it("round-trips through a share link and merges the more advanced status", () => {
    const a = setStatus(emptyProgress(), "x", "revising");
    const b = setStatus(setStatus(emptyProgress(), "x", "ready"), "y", "revising");
    const decoded = decodeProgress(encodeProgress(b))!;
    expect(decoded.status).toEqual(b.status);
    expect(mergeProgress(a, decoded).status).toEqual({ x: "ready", y: "revising" });
  });
});

describe("study plan", () => {
  it("spreads topics over the learning days and keeps the last two for a mock and revision", () => {
    const ids = Array.from({ length: 40 }, (_, i) => `t${i}`);
    const plan = buildPlan(ids, 14, "2026-11-01");
    expect(plan).toHaveLength(14);
    expect(plan.slice(0, 12).flatMap((d) => d.topicIds)).toEqual(ids);
    expect(plan[12].kind).toBe("mock");
    expect(plan[13].kind).toBe("revise");
    expect(plan[13].date).toBe("2026-11-14");
  });

  it("works out today's day, clamped to the plan", () => {
    expect(dayNumber("2026-11-01", "2026-11-05", 14)).toBe(5);
    expect(dayNumber("2026-11-01", "2026-10-20", 14)).toBe(1);
    expect(dayNumber("2026-11-01", "2026-12-30", 14)).toBe(14);
  });
});
