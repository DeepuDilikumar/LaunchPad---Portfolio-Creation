"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/inputs";

export function ContactForm({ initialKind }: { initialKind: "team" | "college" | "review" | "other" }) {
  const [f, setF] = useState({ name: "", email: "", organization: "", kind: initialKind, seats: "", message: "", website: "" });
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [err, setErr] = useState<string | null>(null);
  const set = (k: keyof typeof f, v: string) => setF((s) => ({ ...s, [k]: v }));

  const submit = async () => {
    setState("busy");
    setErr(null);
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...f, seats: f.seats ? Number(f.seats) : undefined }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string; issues?: { path: string }[] };
    if (!res.ok) {
      setState("error");
      setErr(data.issues?.length ? `Check these fields: ${data.issues.map((i) => i.path).join(", ")}.` : (data.error ?? "That didn't send. Try again."));
      return;
    }
    setState("done");
  };

  if (state === "done") {
    return (
      <div role="status" className="h-fit rounded-[24px] border border-line bg-surface-1 p-6" data-contact-sent>
        <p className="t-h3 text-text-1">Thanks, we&apos;ve got it</p>
        <p className="mt-2 t-body text-text-2">We reply within two working days.</p>
      </div>
    );
  }

  return (
    <form
      className="h-fit space-y-4 rounded-[24px] border border-line bg-surface-1 p-5 md:p-6"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <Field label="Your name (required)" htmlFor="c-name">
        <Input id="c-name" required value={f.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" />
      </Field>
      <Field label="Work email (required)" htmlFor="c-email">
        <Input id="c-email" type="email" required value={f.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" />
      </Field>
      <Field label="Company or college (required)" htmlFor="c-org">
        <Input id="c-org" required value={f.organization} onChange={(e) => set("organization", e.target.value)} autoComplete="organization" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="This is for" htmlFor="c-kind">
          <Select id="c-kind" value={f.kind} onChange={(e) => set("kind", e.target.value)}>
            <option value="team">A team</option>
            <option value="college">A college</option>
            <option value="review">Pro + Review</option>
            <option value="other">Something else</option>
          </Select>
        </Field>
        <Field label="Seats" htmlFor="c-seats">
          <Input id="c-seats" type="number" min={1} inputMode="numeric" value={f.seats} onChange={(e) => set("seats", e.target.value)} />
        </Field>
      </div>
      <Field label="Anything else?" htmlFor="c-msg">
        <Textarea id="c-msg" value={f.message} onChange={(e) => set("message", e.target.value)} rows={4} />
      </Field>
      <div className="hidden" aria-hidden>
        <label htmlFor="c-web">Website</label>
        <input id="c-web" tabIndex={-1} autoComplete="off" value={f.website} onChange={(e) => set("website", e.target.value)} />
      </div>
      {err ? (
        <p role="alert" className="t-small text-failed">
          {err}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={state === "busy"}>
        Send
      </Button>
    </form>
  );
}
