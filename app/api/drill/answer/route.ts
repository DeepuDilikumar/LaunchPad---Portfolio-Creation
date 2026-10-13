import { site } from "@/config/site";
import { findQuestion } from "@/lib/content/load";
import { getStore } from "@/lib/db";
import { currentDrillUser, nextTurn } from "@/lib/drill";
import { bad, json, readJson } from "@/lib/http";
import { alertOwner } from "@/lib/alert";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req: Request) {
  if (!site.features.drill) return bad("Not found.", 404);
  const email = await currentDrillUser();
  if (!email) return bad("Please log in again.", 401);
  const body = await readJson<{ sessionId?: string; answer?: string }>(req);
  const answer = body?.answer?.trim().slice(0, 4000) ?? "";
  if (!body?.sessionId || answer.length < 3) return bad("Type your answer first.");

  const store = getStore();
  const s = await store.getDrillSession(body.sessionId);
  if (!s || s.email !== email) return bad("Drill not found.", 404);
  if (s.status === "done") return bad("This drill is finished. Start another.", 409);
  const q = findQuestion("backend", s.question_id);
  if (!q) return bad("Question no longer available.", 404);

  const transcript = [...s.transcript, { role: "candidate" as const, text: answer }];
  await store.updateDrillSession(s.id, { transcript });
  try {
    const turn = await nextTurn(q, { ...s, transcript });
    const fresh = (await store.getDrillSession(s.id))!;
    if (turn.done) {
      await store.updateDrillSession(s.id, { status: "done", score: turn.score });
      return json({
        done: true,
        score: turn.score,
        feedback: turn.feedback,
        signalsHit: turn.signals_hit,
        strong: { moves: q.answer_framework, model: q.model_answer },
        costUsd: Number(fresh.cost_usd.toFixed(5)),
      });
    }
    await store.updateDrillSession(s.id, {
      transcript: [...transcript, { role: "interviewer", text: turn.next_question }],
    });
    return json({ done: false, question: turn.next_question, type: turn.follow_up_type });
  } catch (err) {
    await alertOwner("Drill turn failed", { sessionId: s.id }, err);
    return bad("The interviewer lost its train of thought. Try sending that again.", 502);
  }
}
