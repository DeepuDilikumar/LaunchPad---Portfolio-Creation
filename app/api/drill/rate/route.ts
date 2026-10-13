import { site } from "@/config/site";
import { getStore } from "@/lib/db";
import { currentDrillUser } from "@/lib/drill";
import { bad, json, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!site.features.drill) return bad("Not found.", 404);
  const email = await currentDrillUser();
  const body = await readJson<{ sessionId?: string; rating?: number }>(req);
  const rating = Number(body?.rating);
  if (!email || !body?.sessionId || !(rating >= 1 && rating <= 5)) return bad("Bad request.");
  const s = await getStore().getDrillSession(body.sessionId);
  if (!s || s.email !== email) return bad("Not found.", 404);
  await getStore().updateDrillSession(s.id, { rating: Math.round(rating) });
  return json({ ok: true });
}
