import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { recordEvent } from "@/lib/analytics/server";
import { isAnalyticsEvent } from "@/lib/analytics/events";
import { clientIp, rateLimit } from "@/lib/rate-limit";

// Events the server already records itself (with stronger guarantees) are ignored here.
const serverOwned = new Set(["checkpoint_passed", "purchase_completed", "signup_completed", "module_completed", "project_completed", "proof_published", "tutor_message_sent", "onboarding_completed", "decision_saved"]);

const body = z.object({ event: z.string().max(40), props: z.record(z.string(), z.unknown()).optional() });

export async function POST(req: Request) {
  const rl = await rateLimit(`events:${clientIp(req)}`, 120, 60);
  if (!rl.ok) return new Response(null, { status: 429 });
  let parsed;
  try {
    parsed = body.safeParse(JSON.parse(await req.text()));
  } catch {
    return new Response(null, { status: 400 });
  }
  if (!parsed.success || !isAnalyticsEvent(parsed.data.event) || serverOwned.has(parsed.data.event)) return new Response(null, { status: 204 });
  const user = await getSessionUser();
  const props = Object.fromEntries(
    Object.entries(parsed.data.props ?? {})
      .filter(([, v]) => ["string", "number", "boolean"].includes(typeof v))
      .slice(0, 12)
      .map(([k, v]) => [k.slice(0, 40), typeof v === "string" ? v.slice(0, 200) : v]),
  );
  await recordEvent(parsed.data.event, user?.id ?? null, props);
  return new Response(null, { status: 204 });
}
