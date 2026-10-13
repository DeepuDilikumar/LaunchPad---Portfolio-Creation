"use client";

import { useState } from "react";
import { site } from "@/config/site";

export function ReviewForm({ token }: { token: string }) {
  const [f, setF] = useState({
    name: "",
    role: "",
    years: "2–4",
    rating: 5,
    body: "",
    consent: true,
  });
  const [state, setState] = useState<{ error?: string; referralUrl?: string; done?: boolean }>({});
  const [busy, setBusy] = useState(false);
  const input = "min-h-12 rounded-[10px] border-[1.5px] border-ink bg-card px-3.5 text-base";

  if (state.done) {
    return (
      <div className="card-ink flex flex-col gap-3 p-6">
        <h2 className="font-head m-0 text-2xl font-bold">
          Thank you. It’s in the moderation queue.
        </h2>
        {state.referralUrl ? (
          <>
            <p className="m-0">
              Your referral link (also sent by email). Your friend gets ₹
              {site.referral.friendDiscount} off; you get ₹{site.referral.buyerReward} back when
              they buy:
            </p>
            <code className="bg-blue-wash rounded px-2 py-1.5 font-mono text-sm break-all">
              {state.referralUrl}
            </code>
          </>
        ) : null}
      </div>
    );
  }

  return (
    <form
      className="card-ink flex flex-col gap-4 p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const res = await fetch("/api/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ t: token, ...f }),
        });
        const data = (await res.json()) as { error?: string; referralUrl?: string };
        setBusy(false);
        setState(res.ok ? { done: true, referralUrl: data.referralUrl } : { error: data.error });
      }}
    >
      <label className="flex flex-col gap-1.5 font-semibold">
        First name (shown with the review)
        <input
          className={input}
          required
          maxLength={60}
          value={f.name}
          onChange={(e) => setF({ ...f, name: e.target.value })}
        />
      </label>
      <label className="flex flex-col gap-1.5 font-semibold">
        Role
        <input
          className={input}
          required
          maxLength={80}
          placeholder="Backend engineer, SDE 2…"
          value={f.role}
          onChange={(e) => setF({ ...f, role: e.target.value })}
        />
      </label>
      <fieldset className="m-0 flex flex-col gap-1.5 border-none p-0">
        <legend className="mb-1.5 font-semibold">Years of experience</legend>
        <div className="flex flex-wrap gap-2">
          {["0–2", "2–4", "4–8", "8+"].map((y) => (
            <button
              key={y}
              type="button"
              aria-pressed={f.years === y}
              onClick={() => setF({ ...f, years: y })}
              className={`border-ink min-h-11 rounded-full border-[1.5px] px-4 ${f.years === y ? "bg-ink text-card" : "bg-card"}`}
            >
              {y}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="m-0 flex flex-col gap-1.5 border-none p-0">
        <legend className="mb-1.5 font-semibold">Rating</legend>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              aria-pressed={f.rating === n}
              onClick={() => setF({ ...f, rating: n })}
              className={`min-h-11 min-w-11 text-2xl ${n <= f.rating ? "text-[#E8B93C]" : "text-rule"}`}
            >
              ★
            </button>
          ))}
        </div>
      </fieldset>
      <label className="flex flex-col gap-1.5 font-semibold">
        Your review
        <textarea
          className={`${input} min-h-32 py-2.5`}
          required
          minLength={20}
          maxLength={1200}
          placeholder="What helped? What was missing?"
          value={f.body}
          onChange={(e) => setF({ ...f, body: e.target.value })}
        />
      </label>
      <label className="flex items-center gap-2.5 text-sm">
        <input
          type="checkbox"
          className="h-[18px] w-[18px]"
          checked={f.consent}
          onChange={(e) => setF({ ...f, consent: e.target.checked })}
        />
        You can show this review on the site with my first name, role and years of experience
      </label>
      {state.error ? (
        <p role="alert" className="text-red-dark m-0 text-sm">
          {state.error}
        </p>
      ) : null}
      <button type="submit" className="keycap" disabled={busy}>
        {busy ? "Sending…" : "Send review"}
      </button>
    </form>
  );
}
