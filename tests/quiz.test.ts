import { describe, expect, it } from "vitest";
import { loadQuiz } from "@/lib/quiz-data";
import { scoreQuiz, strongKey } from "@/lib/quiz";

const quiz = loadQuiz("backend");
const allStrong = Object.fromEntries(quiz.questions.map((q) => [q.id, strongKey(q)]));

describe("readiness check scoring", () => {
  it("all strong: 8/8 and no weakest area", () => {
    const o = scoreQuiz(quiz, allStrong);
    expect(o.strong).toBe(8);
    expect(o.weakest).toBeNull();
    expect(o.missed).toEqual([]);
    expect(o.complete).toBe(true);
  });

  it("finds the weakest area and the two missed questions in it", () => {
    const answers = { ...allStrong };
    for (const q of quiz.questions.filter((x) => x.area === "caching"))
      answers[q.id] = q.options.find((o) => o.grade === "weak")!.key;
    const o = scoreQuiz(quiz, answers);
    expect(o.strong).toBe(6);
    expect(o.weakest?.id).toBe("caching");
    expect(o.missed.map((m) => m.question.area)).toEqual(["caching", "caching"]);
  });

  it("reports incomplete answers", () => {
    expect(scoreQuiz(quiz, {}).complete).toBe(false);
  });
});
