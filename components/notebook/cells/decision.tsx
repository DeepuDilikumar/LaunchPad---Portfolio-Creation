"use client";

import { useEffect, useRef, useState } from "react";
import { Textarea } from "@/components/ui/inputs";
import { StatusChip } from "@/components/ui/pill";
import { DECISION_MIN_CHARS } from "@/lib/progress";
import { CellFrame } from "./frame";
import { useNotebookOptional } from "../context";

type SaveState = "idle" | "saving" | "saved" | "error";

export function Decision({ id, question, children }: { id: string; question: string; children?: React.ReactNode }) {
  const nb = useNotebookOptional();
  const initial = nb?.decisions[id];
  const [text, setText] = useState(initial?.text ?? "");
  const [isPublic, setIsPublic] = useState(initial?.isPublic ?? false);
  const [save, setSave] = useState<SaveState>(initial?.text ? "saved" : "idle");
  const timer = useRef<number | undefined>(undefined);
  const latest = useRef({ text, isPublic });

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const schedule = (nextText: string, nextPublic: boolean) => {
    latest.current = { text: nextText, isPublic: nextPublic };
    window.clearTimeout(timer.current);
    setSave("saving");
    timer.current = window.setTimeout(async () => {
      if (!nb) return;
      const ok = await nb.saveDecision(id, latest.current.text, latest.current.isPublic);
      setSave(ok ? "saved" : "error");
    }, 800);
  };

  const count = text.trim().length;
  const enough = count >= DECISION_MIN_CHARS;

  return (
    <CellFrame id={id} kind="decision">
      <div className="rounded-[16px] border border-line bg-surface-1" data-decision={id}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-2.5">
          <p className="t-small font-medium text-text-1">Decision</p>
          <div role="status" className="min-h-6">
            {save === "saved" && enough ? <StatusChip status="passed">Saved to your build journal</StatusChip> : null}
            {save === "saving" ? <span className="t-small text-text-2">Saving…</span> : null}
            {save === "error" ? <span className="t-small text-failed">Not saved. Keep typing to retry.</span> : null}
          </div>
        </div>
        <div className="space-y-3 px-4 py-3.5">
          <label htmlFor={`${id}-text`} className="block t-body text-text-1">
            {question}
          </label>
          {children ? <div className="prose-bp t-small">{children}</div> : null}
          <Textarea
            id={`${id}-text`}
            value={text}
            placeholder="What did the agent propose? What did you keep, reject or change, and why?"
            onChange={(e) => {
              if (!nb?.user) {
                nb?.requireAuth(id);
                return;
              }
              setText(e.target.value);
              schedule(e.target.value, isPublic);
            }}
            maxLength={4000}
            rows={4}
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="t-small text-text-2">
              {enough ? `${count} characters` : `${Math.max(0, DECISION_MIN_CHARS - count)} more characters to count toward progress`}
            </p>
            <label className="inline-flex cursor-pointer items-center gap-2 t-small text-text-2">
              <input
                type="checkbox"
                className="accent-white"
                checked={isPublic}
                onChange={(e) => {
                  if (!nb?.requireAuth(id)) return;
                  setIsPublic(e.target.checked);
                  if (text.trim()) schedule(text, e.target.checked);
                }}
              />
              Public on my profile
            </label>
          </div>
        </div>
      </div>
    </CellFrame>
  );
}
