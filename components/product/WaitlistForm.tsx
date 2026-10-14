"use client";

import { useState } from "react";
import { track } from "@/lib/track";

export function WaitlistForm({
  product,
  dark = false,
  label = "Tell me when it’s out",
}: {
  product: string;
  dark?: boolean;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const btn = dark
    ? "inline-flex min-h-[50px] items-center justify-center rounded-xl border-[1.5px] border-card bg-transparent px-5 font-semibold text-card"
    : "keycap-ghost !min-h-11 !text-[15px]";

  if (!open) {
    return (
      <button type="button" className={btn} onClick={() => setOpen(true)}>
        {label}
      </button>
    );
  }
  if (msg) return <p className={`m-0 text-[15px] ${dark ? "text-card" : ""}`}>{msg}</p>;
  return (
    <form
      className="flex flex-wrap gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const res = await fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, source: "waitlist", product }),
        });
        const data = (await res.json()) as { message?: string; error?: string };
        setBusy(false);
        if (res.ok) track("generate_lead", { source: `waitlist:${product}` });
        setMsg(data.message ?? data.error ?? "Done.");
      }}
    >
      <label htmlFor={`wl-${product}`} className="sr-only">
        Email
      </label>
      <input
        id={`wl-${product}`}
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@email.com"
        className="border-ink bg-card text-ink min-h-11 flex-[1_1_200px] rounded-[10px] border-[1.5px] px-3.5 text-base"
      />
      <button type="submit" className={btn} disabled={busy}>
        Notify me
      </button>
    </form>
  );
}
