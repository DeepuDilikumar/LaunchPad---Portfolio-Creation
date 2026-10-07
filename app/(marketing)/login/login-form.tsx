"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/inputs";
import { Caret } from "@/components/ui/caret";
import { IconGithub } from "@/components/ui/icons";
import { track } from "@/lib/analytics/client";

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.3-.4-3.5z" />
    </svg>
  );
}

export function LoginForm({
  next,
  mockMode,
  supabaseUrl,
  supabaseAnonKey,
  siteUrl,
  error,
}: {
  next: string;
  mockMode: boolean;
  supabaseUrl: string;
  supabaseAnonKey: string;
  siteUrl: string;
  error?: string;
}) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(error ?? null);
  const callback = `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`;

  const mockSignIn = async (method: string) => {
    setBusy(method);
    setErr(null);
    track("signup_started", { method });
    const res = await fetch("/api/auth/mock", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ method, email: method === "email" ? email : undefined, next }),
    });
    const data = (await res.json().catch(() => ({}))) as { redirect?: string; error?: string };
    if (!res.ok || !data.redirect) {
      setErr(data.error ?? "Sign-in failed. Try again.");
      setBusy(null);
      return;
    }
    window.location.assign(data.redirect);
  };

  const supabase = async () => {
    const { createBrowserClient } = await import("@supabase/ssr");
    return createBrowserClient(supabaseUrl, supabaseAnonKey);
  };

  const oauth = async (provider: "github" | "google") => {
    if (mockMode) return mockSignIn(provider);
    setBusy(provider);
    track("signup_started", { method: provider });
    const sb = await supabase();
    const { error } = await sb.auth.signInWithOAuth({ provider, options: { redirectTo: callback } });
    if (error) {
      setErr("Couldn't start sign-in with that provider. Try another option.");
      setBusy(null);
    }
  };

  const magic = async () => {
    if (mockMode) return mockSignIn("email");
    setBusy("email");
    track("signup_started", { method: "email" });
    const sb = await supabase();
    const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: callback } });
    setBusy(null);
    if (error) setErr("We couldn't send the link. Check the address and try again.");
    else setSent(true);
  };

  return (
    <div className="w-full max-w-[400px]">
      <div className="flex justify-center">
        <Caret size={44} track />
      </div>
      <h1 className="mt-6 text-center t-h2 text-text-1">Save your progress</h1>
      <p className="mt-3 text-center t-body text-text-2">Sign in to keep your checkpoints, decisions and build journal.</p>

      <div className="mt-8 space-y-2.5">
        <Button variant="secondary" className="w-full" onClick={() => oauth("github")} disabled={!!busy} data-auth="github">
          <IconGithub /> Continue with GitHub
        </Button>
        <Button variant="secondary" className="w-full" onClick={() => oauth("google")} disabled={!!busy} data-auth="google">
          <GoogleIcon /> Continue with Google
        </Button>
      </div>

      <div className="my-6 flex items-center gap-3 t-small text-text-3">
        <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
      </div>

      {sent ? (
        <p role="status" className="rounded-[14px] border border-line bg-surface-1 p-4 t-small text-text-1">
          Check your inbox for a sign-in link. It expires in an hour.
        </p>
      ) : (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void magic();
          }}
        >
          <Field label="Email" htmlFor="login-email">
            <Input id="login-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </Field>
          <Button type="submit" className="w-full" disabled={!!busy || !email}>
            {mockMode ? "Continue with email" : "Email me a sign-in link"}
          </Button>
        </form>
      )}

      {err ? (
        <p role="alert" className="mt-4 t-small text-failed">
          {err}
        </p>
      ) : null}

      {mockMode ? (
        <div className="mt-8 rounded-[14px] border border-dashed border-line-strong p-4">
          <p className="t-small text-text-1">Local mock mode</p>
          <p className="mt-1 t-small text-text-2">No keys are configured, so sign-in is simulated and no email is sent. GitHub and Google create a new account each time.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => mockSignIn("demo")} disabled={!!busy} data-auth="demo">
              Continue as demo learner
            </Button>
            <Button size="sm" variant="ghost" onClick={() => mockSignIn("admin")} disabled={!!busy} data-auth="admin">
              Sign in as admin
            </Button>
          </div>
        </div>
      ) : null}

      <p className="mt-8 text-center t-small text-text-3">
        By continuing you agree to the <a className="underline underline-offset-2 hover:text-text-1" href="/legal/terms">terms</a> and{" "}
        <a className="underline underline-offset-2 hover:text-text-1" href="/legal/privacy">privacy policy</a>.
      </p>
    </div>
  );
}
