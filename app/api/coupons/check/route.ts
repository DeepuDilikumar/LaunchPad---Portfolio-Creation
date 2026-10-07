import { getSessionUser } from "@/lib/auth/session";
import { error, json } from "@/lib/http";
import { getDb } from "@/lib/db";
import { applyCoupon, couponProblem, findCoupon } from "@/lib/payments";
import { products, type ProductSlug, type Currency } from "@/config/pricing";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return error(401, "Sign in first.");
  const rl = await rateLimit(`coupon-check:${clientIp(req)}`, 30, 600);
  if (!rl.ok) return error(429, "Too many attempts.");
  const url = new URL(req.url);
  const code = url.searchParams.get("code") ?? "";
  const product = url.searchParams.get("product") as ProductSlug;
  const currency = url.searchParams.get("currency") as Currency;
  if (!products[product] || !["INR", "USD"].includes(currency)) return error(400, "Unknown product or currency.");
  const c = await findCoupon(await getDb(), code);
  const problem = couponProblem(c);
  if (problem) return error(400, problem);
  if (c!.kind === "grant") return json({ kind: "grant", scope: c!.scope });
  return json({ kind: c!.kind, amount: applyCoupon(products[product].price[currency], c) });
}
