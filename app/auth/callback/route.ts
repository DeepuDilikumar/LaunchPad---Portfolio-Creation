import { NextResponse } from "next/server";
import { mock } from "@/lib/env";
import { safeReturnTo } from "@/lib/http";
import { afterSignIn } from "@/lib/auth/sign-in";

/** Supabase OAuth / magic-link callback: exchange the code, ensure a profile, route to onboarding or next. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const next = safeReturnTo(url.searchParams.get("next"), "/dashboard");
  if (mock.auth) return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(next)}`, url));
  const code = url.searchParams.get("code");
  if (!code) return NextResponse.redirect(new URL(`/login?error=missing_code&next=${encodeURIComponent(next)}`, url));
  const { createSupabaseServerClient } = await import("@/lib/auth/supabase");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) return NextResponse.redirect(new URL(`/login?error=link_expired&next=${encodeURIComponent(next)}`, url));
  const m = data.user.user_metadata ?? {};
  const { profile } = await afterSignIn(data.user.id, data.user.email ?? null, {
    name: String(m.full_name ?? m.name ?? ""),
    githubUsername: m.user_name ? String(m.user_name) : null,
    avatarUrl: m.avatar_url ? String(m.avatar_url) : null,
  });
  const dest = profile.onboardedAt ? next : `/onboarding?next=${encodeURIComponent(next)}`;
  return NextResponse.redirect(new URL(dest, url));
}
