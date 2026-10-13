import { cookies } from "next/headers";
import { getStore } from "@/lib/db";
import { bad, json, readJson } from "@/lib/http";
import { loadQuiz } from "@/lib/quiz-data";
import { scoreQuiz } from "@/lib/quiz";

export const dynamic = "force-dynamic";

/** Records a finished check anonymously, for the started → finished funnel. No email needed. */
export async function POST(req: Request) {
  const body = await readJson<{
    quiz?: string;
    answers?: Record<string, string>;
    warmup?: Record<string, string>;
  }>(req);
  if (body?.quiz !== "backend" || !body.answers) return bad("Bad request.");
  const quiz = loadQuiz(body.quiz);
  const outcome = scoreQuiz(quiz, body.answers);
  if (!outcome.complete) return bad("Incomplete.");
  const result = await getStore().saveQuizResult({
    lead_id: null,
    quiz: quiz.slug,
    answers: body.answers,
    warmup: body.warmup ?? {},
    scores: Object.fromEntries(
      outcome.areas.map((a) => [a.id, { correct: a.correct, total: a.total }]),
    ),
    weakest: outcome.weakest?.id ?? null,
  });
  (await cookies()).set("sq_quiz", result.id, { maxAge: 60 * 60 * 24, sameSite: "lax", path: "/" });
  return json({ ok: true, id: result.id });
}
