"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { Caret } from "@/components/ui/caret";
import { cn } from "@/lib/cn";

const steps = [
  {
    key: "experienceLevel",
    title: "How much experience do you have?",
    options: [
      { value: "student", label: "Student or new grad" },
      { value: "0-2", label: "0–2 years" },
      { value: "2-5", label: "2–5 years" },
      { value: "5+", label: "5+ years" },
    ],
  },
  {
    key: "targetRole",
    title: "What role are you aiming for?",
    options: [
      { value: "product", label: "Product engineer" },
      { value: "ai", label: "AI engineer" },
      { value: "backend", label: "Backend or platform" },
      { value: "fullstack", label: "Full-stack" },
    ],
  },
  {
    key: "preferredTool",
    title: "Which agent will you use?",
    options: [
      { value: "claude", label: "Claude Code" },
      { value: "codex", label: "Codex" },
      { value: "cursor", label: "Cursor" },
    ],
  },
] as const;

export function Onboarding({ next }: { next: string }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const current = steps[step]!;
  const headingRef = useRef<HTMLHeadingElement>(null);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  const choose = async (value: string) => {
    const nextAnswers = { ...answers, [current.key]: value };
    setAnswers(nextAnswers);
    if (step < steps.length - 1) {
      setStep(step + 1);
      return;
    }
    setBusy(true);
    try {
      window.localStorage.setItem("bp_tool", nextAnswers.preferredTool ?? "claude");
    } catch {}
    const res = await fetch("/api/onboarding", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(nextAnswers) });
    if (!res.ok) {
      setBusy(false);
      setErr("That didn't save. Try again.");
      return;
    }
    window.location.assign(next);
  };

  return (
    <main id="main" className="flex min-h-dvh flex-col items-center justify-center px-5 py-16">
      <Caret size={40} track />
      <p className="mt-6 t-small text-text-2" aria-live="polite">
        Step {step + 1} of {steps.length}
      </p>
      <AnimatePresence mode="wait">
        <m.div
          key={step}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[440px]"
        >
          <h1 ref={headingRef} tabIndex={-1} className="mt-3 text-center t-h2 text-text-1 outline-none">
            {current.title}
          </h1>
          <div className="mt-8 grid gap-2.5" role="group" aria-label={current.title}>
            {current.options.map((o) => (
              <button
                key={o.value}
                type="button"
                disabled={busy}
                data-choice={o.value}
                aria-pressed={answers[current.key] === o.value}
                onClick={() => void choose(o.value)}
                className={cn(
                  "h-12 rounded-[14px] border border-line bg-surface-1 px-4 text-left text-[15px] text-text-1 transition-colors hover:bg-surface-2",
                  answers[current.key] === o.value && "border-line-strong bg-surface-2",
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
        </m.div>
      </AnimatePresence>
      {step > 0 ? (
        <button type="button" onClick={() => setStep(step - 1)} className="mt-6 t-small text-text-2 hover:text-text-1">
          Back
        </button>
      ) : null}
      {err ? (
        <p role="alert" className="mt-4 t-small text-failed">
          {err}
        </p>
      ) : null}
    </main>
  );
}
