import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { error, json, parseBody } from "@/lib/http";
import { redeemGrantCoupon } from "@/lib/payments";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return error(401, "Sign in to redeem a code.");
  const rl = await rateLimit(`coupon:${user.id}:${clientIp(req)}`, 10, 600);
  if (!rl.ok) return error(429, "Too many attempts. Wait a few minutes.");
  const [data, bad] = await parseBody(req, z.object({ code: z.string().trim().min(3).max(40) }));
  if (bad) return bad;
  const r = await redeemGrantCoupon(user.id, data.code);
  if (!r.ok) return error(400, r.error);
  return json({ ok: true, scope: r.scope });
}
