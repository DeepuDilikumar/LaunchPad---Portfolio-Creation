import { site } from "@/config/site";
import { findQuestion } from "@/lib/content/load";
import { getStore } from "@/lib/db";
import { checkLimits, currentDrillUser, hasDrillAccess } from "@/lib/drill";
import { bad, json, readJson } from "@/lib/http";
import { randomId } from "@/lib/ids";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!site.features.drill) return bad("Not found.", 404);
  const email = await currentDrillUser();
  if (!email || !(await hasDrillAccess(email))) return bad("Please log in again.", 401);
  const body = await readJson<{ questionId?: string }>(req);
  const q = body?.questionId ? findQuestion("backend", body.questionId) : undefined;
  if (!q) return bad("Unknown question.", 404);
  const limit = await checkLimits(email);
  if (limit) return bad(limit, 429);
  const session = await getStore().createDrillSession({
    id: randomId("drill"),
    email,
    question_id: q.id,
    transcript: [{ role: "interviewer", text: q.title }],
    status: "active",
    score: null,
    rating: null,
    input_tokens: 0,
    output_tokens: 0,
    cost_usd: 0,
    created_at: new Date().toISOString(),
  });
  return json({ sessionId: session.id, question: q.title });
}
