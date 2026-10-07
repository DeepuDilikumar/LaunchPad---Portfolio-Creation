import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { mock, env } from "@/lib/env";
import { safeReturnTo } from "@/lib/http";
import { getSessionUser } from "@/lib/auth/session";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in", robots: { index: false }, alternates: { canonical: "/login" } };

const errors: Record<string, string> = {
  link_expired: "That sign-in link has expired or was already used. Send yourself a new one.",
  missing_code: "The sign-in link was incomplete. Send yourself a new one.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const next = safeReturnTo(sp.next, "/dashboard");
  const user = await getSessionUser();
  if (user) redirect(user.profile.onboardedAt ? next : `/onboarding?next=${encodeURIComponent(next)}`);
  return (
    <div className="container-bp flex min-h-[80vh] items-center justify-center pb-16 pt-28">
      <LoginForm
        next={next}
        mockMode={mock.auth}
        supabaseUrl={env.supabaseUrl}
        supabaseAnonKey={env.supabaseAnonKey}
        siteUrl={env.siteUrl}
        error={sp.error ? (errors[sp.error] ?? "Sign-in didn't complete. Try again.") : undefined}
      />
    </div>
  );
}
