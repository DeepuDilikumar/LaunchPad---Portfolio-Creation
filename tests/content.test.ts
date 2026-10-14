import { describe, expect, it } from "vitest";
import { listGuideSlugs, loadGuide } from "@/lib/content/load";
import { nearDuplicateTitles, titleSimilarity } from "@/lib/content/quality";
import { questionSchema } from "@/lib/content/schema";
import { countQuestions } from "@/lib/content/stats";
import { listArticles } from "@/lib/learn";
import { loadQuiz } from "@/lib/quiz-data";
import { readSources } from "@/lib/content/sources";

describe("guide content", () => {
  it("every question file validates", () => {
    for (const slug of listGuideSlugs())
      expect(loadGuide(slug, { fresh: true }).issues).toEqual([]);
  });

  it("has no near-duplicate titles", () => {
    for (const slug of listGuideSlugs())
      expect(nearDuplicateTitles(loadGuide(slug).questions)).toEqual([]);
  });

  it("logs every source in sources.csv", () => {
    const logged = new Set(readSources().map((s) => s.url));
    for (const slug of listGuideSlugs())
      for (const q of loadGuide(slug).questions)
        for (const u of q.sources) expect(logged.has(u)).toBe(true);
  });

  it("counts come from the content, not from copy", () => {
    const { questions } = loadGuide("backend");
    const c = countQuestions(questions);
    expect(c.questions).toBe(questions.length);
    expect(c.followUps).toBe(questions.reduce((n, q) => n + q.follow_ups.length, 0));
    expect(c.followUpsMin).toBeGreaterThanOrEqual(3);
  });
});

describe("quality gates", () => {
  const base = loadGuide("backend").questions[0];
  it("rejects fewer than 3 follow-ups", () => {
    const r = questionSchema.safeParse({ ...base, follow_ups: base.follow_ups.slice(0, 2) });
    expect(r.success).toBe(false);
  });
  it("rejects follow-ups of a single type", () => {
    const r = questionSchema.safeParse({
      ...base,
      follow_ups: base.follow_ups.map((f) => ({ ...f, type: "technical" })),
    });
    expect(r.success).toBe(false);
  });
  it("rejects a missing field", () => {
    const { intent: _drop, ...rest } = base;
    void _drop;
    expect(questionSchema.safeParse(rest).success).toBe(false);
  });
  it("detects near-duplicate titles", () => {
    expect(
      titleSimilarity("A customer was charged twice. Why?", "Why was a customer charged twice?"),
    ).toBeGreaterThan(0.7);
    expect(
      titleSimilarity("Design a rate limiter", "A migration locked the orders table"),
    ).toBeLessThan(0.2);
  });
});

describe("quiz and articles", () => {
  it("every quiz question points at a real guide question", () => {
    const ids = new Set(loadGuide("backend").questions.map((q) => q.id));
    for (const q of loadQuiz("backend").questions) expect(ids.has(q.source)).toBe(true);
  });
  it("learn articles parse", () => {
    expect(listArticles().length).toBeGreaterThanOrEqual(4);
  });
});
