"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/inputs";
import { SegmentedToggle } from "@/components/ui/segmented";
import { useToast } from "@/components/ui/toast";
import { setThemePref, useTheme, type ThemePref } from "@/lib/theme";

const themeOptions: { value: ThemePref; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

type Form = {
  name: string;
  handle: string;
  headline: string;
  githubUsername: string;
  preferredTool: "claude" | "codex" | "cursor";
  isPublic: boolean;
  marketingEmails: boolean;
};

export function SettingsForm({ initial, email, githubFromOAuth }: { initial: Form; email: string; githubFromOAuth: boolean }) {
  const [f, setF] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const toast = useToast();
  const { pref } = useTheme();
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((s) => ({ ...s, [k]: v }));

  const save = async () => {
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/settings", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(f) });
    const data = (await res.json().catch(() => ({}))) as { error?: string; issues?: { message: string }[] };
    setBusy(false);
    if (!res.ok) setErr(data.issues?.[0]?.message ?? data.error ?? "That didn't save.");
    else {
      try {
        window.localStorage.setItem("bp_tool", f.preferredTool);
      } catch {}
      toast("Saved", "passed");
    }
  };

  return (
    <form
      className="mt-8 space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
    >
      <Field label="Name" htmlFor="s-name">
        <Input id="s-name" value={f.name} onChange={(e) => set("name", e.target.value)} maxLength={80} />
      </Field>
      <Field label="Handle" htmlFor="s-handle" hint={`Your public profile: /u/${f.handle || "your-handle"}`}>
        <Input id="s-handle" value={f.handle} onChange={(e) => set("handle", e.target.value)} maxLength={30} />
      </Field>
      <Field label="Headline" htmlFor="s-headline" hint="One line recruiters see first, like 'Backend engineer, payments and real-time systems'.">
        <Input id="s-headline" value={f.headline} onChange={(e) => set("headline", e.target.value)} maxLength={120} />
      </Field>
      <Field
        label="GitHub username"
        htmlFor="s-gh"
        hint={githubFromOAuth ? "Linked from your GitHub sign-in. Verification checks that your repos belong to this account." : "Used to verify that project repos belong to you."}
      >
        <Input id="s-gh" value={f.githubUsername} onChange={(e) => set("githubUsername", e.target.value)} disabled={githubFromOAuth} maxLength={39} />
      </Field>
      <Field label="Preferred agent" htmlFor="s-tool">
        <Select id="s-tool" value={f.preferredTool} onChange={(e) => set("preferredTool", e.target.value as Form["preferredTool"])}>
          <option value="claude">Claude Code</option>
          <option value="codex">Codex</option>
          <option value="cursor">Cursor</option>
        </Select>
      </Field>
      <label className="flex items-start gap-3">
        <input type="checkbox" className="mt-1 accent-[var(--text-1)]" checked={f.isPublic} onChange={(e) => set("isPublic", e.target.checked)} />
        <span>
          <span className="block t-small text-text-1">Public profile</span>
          <span className="block t-small text-text-2">Show your published proof pages and public decisions at /u/{f.handle}.</span>
        </span>
      </label>
      <label className="flex items-start gap-3">
        <input type="checkbox" className="mt-1 accent-[var(--text-1)]" checked={f.marketingEmails} onChange={(e) => set("marketingEmails", e.target.checked)} />
        <span>
          <span className="block t-small text-text-1">Progress emails</span>
          <span className="block t-small text-text-2">Nudges and milestone emails. Receipts are always sent.</span>
        </span>
      </label>
      <div>
        <p className="t-small text-text-1">Appearance</p>
        <p className="mb-2 t-small text-text-2">Applies right away on this device. System follows your device setting.</p>
        <SegmentedToggle label="Appearance" value={pref} onChange={setThemePref} options={themeOptions} />
      </div>
      {err ? (
        <p role="alert" className="t-small text-failed">
          {err}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={busy}>
          Save
        </Button>
        <Link href={`/u/${initial.handle}`} className="t-small text-text-2 underline underline-offset-4 hover:text-text-1">
          View public profile
        </Link>
      </div>
      <p className="border-t border-line pt-6 t-small text-text-2">Signed in as {email}</p>
    </form>
  );
}
