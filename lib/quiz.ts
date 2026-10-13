import { z } from "zod";

export const quizSchema = z.object({
  slug: z.string(),
  title: z.string(),
  guide: z.string(),
  warmup: z
    .array(z.object({ id: z.string(), label: z.string(), options: z.array(z.string()).min(2) }))
    .length(3),
  areas: z.array(z.object({ id: z.string(), title: z.string(), module: z.string() })).min(2),
  questions: z
    .array(
      z.object({
        id: z.string(),
        area: z.string(),
        source: z.string(),
        prompt: z.string(),
        options: z
          .array(
            z.object({
              key: z.string(),
              text: z.string(),
              grade: z.enum(["strong", "plausible", "weak"]),
            }),
          )
          .length(4)
          .refine(
            (o) => o.filter((x) => x.grade === "strong").length === 1,
            "exactly one strong option",
          ),
        strong_answer: z.string(),
      }),
    )
    .length(8),
});

export type Quiz = z.infer<typeof quizSchema>;
export type QuizQuestion = Quiz["questions"][number];

export interface AreaScore {
  id: string;
  title: string;
  module: string;
  correct: number;
  total: number;
}

export interface QuizOutcome {
  strong: number;
  total: number;
  areas: AreaScore[];
  weakest: AreaScore | null;
  /** Up to two questions answered without the strong option, weakest area first. */
  missed: { question: QuizQuestion; picked: string | null }[];
  complete: boolean;
}

export function strongKey(q: QuizQuestion): string {
  return q.options.find((o) => o.grade === "strong")!.key;
}

/** Scores answers by area. Pure, so the browser shows the result without any server call. */
export function scoreQuiz(quiz: Quiz, answers: Record<string, string>): QuizOutcome {
  const areas: AreaScore[] = quiz.areas.map((a) => ({ ...a, correct: 0, total: 0 }));
  const byId = new Map(areas.map((a) => [a.id, a]));
  let strong = 0;
  for (const q of quiz.questions) {
    const area = byId.get(q.area);
    if (!area) continue;
    area.total += 1;
    if (answers[q.id] === strongKey(q)) {
      area.correct += 1;
      strong += 1;
    }
  }
  const ratio = (a: AreaScore) => (a.total ? a.correct / a.total : 1);
  const sorted = [...areas].sort((a, b) => ratio(a) - ratio(b));
  const weakest = sorted[0] && ratio(sorted[0]) < 1 ? sorted[0] : null;
  const order = new Map(sorted.map((a, i) => [a.id, i]));
  const missed = quiz.questions
    .filter((q) => answers[q.id] !== strongKey(q))
    .sort((a, b) => (order.get(a.area) ?? 0) - (order.get(b.area) ?? 0))
    .slice(0, 2)
    .map((question) => ({ question, picked: answers[question.id] ?? null }));
  return {
    strong,
    total: quiz.questions.length,
    areas,
    weakest,
    missed,
    complete: quiz.questions.every((q) => Boolean(answers[q.id])),
  };
}
