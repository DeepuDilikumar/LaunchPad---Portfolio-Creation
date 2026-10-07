"use client";

import { useState } from "react";
import { Button, LinkButton } from "@/components/ui/button";
import { Input } from "@/components/ui/inputs";
import { useSignedIn } from "@/lib/auth/signed-in-flag";

export function RedeemCode() {
  const signedIn = useSignedIn();
  const [code, setCode] = useState("");
  const [state, setState] = useState<{ kind: "idle" | "busy" | "ok" | "error"; msg?: string }>({ kind: "idle" });

  const redeem = async () => {
    setState({ kind: "busy" });
    const res = await fetch("/api/coupons/redeem", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code }) });
    const data = (await res.json().catch(() => ({}))) as { scope?: string; error?: string };
    if (!res.ok) return setState({ kind: "error", msg: data.error ?? "That code didn't work." });
    setState({ kind: "ok", msg: data.scope === "all" ? "All six projects are unlocked on your account." : "The project is unlocked on your account." });
  };

  return (
    <div className="rounded-[24px] border border-line bg-surface-1 p-5 md:p-6" data-redeem>
      <h2 className="t-h3 text-text-1">Have an access code?</h2>
      <p className="mt-1 t-small text-text-2">Teams and colleges get codes that unlock access directly.</p>
      {!signedIn ? (
        <LinkButton href="/login?next=/pricing" variant="secondary" className="mt-4" size="sm">
          Sign in to redeem
        </LinkButton>
      ) : state.kind === "ok" ? (
        <div className="mt-4 space-y-3">
          <p role="status" className="t-small text-text-1">
            {state.msg}
          </p>
          <LinkButton href="/dashboard" size="sm">
            Go to dashboard
          </LinkButton>
        </div>
      ) : (
        <form
          className="mt-4 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void redeem();
          }}
        >
          <label htmlFor="redeem-code" className="sr-only">
            Access code
          </label>
          <Input id="redeem-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="CODE-1234" autoCapitalize="characters" />
          <Button type="submit" disabled={state.kind === "busy" || code.trim().length < 3}>
            Redeem
          </Button>
        </form>
      )}
      {state.kind === "error" ? (
        <p role="alert" className="mt-3 t-small text-failed">
          {state.msg}
        </p>
      ) : null}
    </div>
  );
}
