import { z } from "zod";
import { randomBytes } from "node:crypto";
import { mockEndpointsEnabled } from "@/lib/env";
import { error, json, parseBody, safeReturnTo } from "@/lib/http";
import { mockSignIn } from "@/lib/auth/sign-in";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { DEMO_USER, ADMIN_USER } from "@/lib/db/seed";

const body = z.object({
  method: z.enum(["github", "google", "email", "demo", "admin"]),
  email: z.string().email().max(200).optional(),
  next: z.string().max(500).optional(),
});

/** Mock sign-in for local development and tests. Disabled whenever real auth is configured. */
export async function POST(req: Request) {
  if (!mockEndpointsEnabled("auth")) return error(404, "Not found");
  const rl = await rateLimit(`auth:${clientIp(req)}`, 30, 60, { failClosed: true });
  if (!rl.ok) return error(429, "Too many sign-in attempts. Wait a minute and try again.");
  const [data, bad] = await parseBody(req, body);
  if (bad) return bad;

  let email: string;
  let meta: { name?: string; githubUsername?: string | null } = {};
  if (data.method === "demo") email = DEMO_USER.email;
  else if (data.method === "admin") email = ADMIN_USER.email;
  else if (data.method === "email") {
    if (!data.email) return error(400, "Enter your email address.");
    email = data.email;
  } else {
    // Simulate an OAuth sign-up: a brand-new account each time.
    const id = randomBytes(4).toString("hex");
    email = `${data.method}-${id}@example.test`;
    meta = data.method === "github" ? { githubUsername: `learner-${id}`, name: "" } : { name: "" };
  }
  const { profile } = await mockSignIn(email, meta);
  const next = safeReturnTo(data.next, "/dashboard");
  const redirect = profile.onboardedAt ? next : `/onboarding?next=${encodeURIComponent(next)}`;
  return json({ ok: true, redirect });
}
