"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { Textarea } from "@/components/ui/inputs";
import { CheckpointChip } from "../views";
import { CellFrame } from "./frame";
import { useNotebookOptional } from "../context";

export function Checkpoint({
  id,
  cmd,
  pass,
  required,
  children,
}: {
  id: string;
  cmd: string;
  pass: string;
  required?: boolean;
  children?: React.ReactNode;
}) {
  const nb = useNotebookOptional();
  const state = nb?.checkpoints[id];
  const [pasting, setPasting] = useState(false);
  const [output, setOutput] = useState(state?.output ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const status = state?.status === "passed" ? "passed" : state?.status === "skipped" ? "idle" : "idle";

  const mark = async (s: "passed" | "skipped") => {
    if (!nb) return;
    setBusy(true);
    setError(null);
    const ok = await nb.markCheckpoint(id, s, s === "passed" && output.trim() ? output.slice(0, 4000) : undefined);
    setBusy(false);
    if (!ok && nb.user) setError("That didn't save. Check your connection and try again.");
    if (ok) setPasting(false);
  };

  return (
    <CellFrame id={id} kind="checkpoint">
      <div className="rounded-[16px] border border-line bg-surface-1" data-checkpoint={id} data-status={state?.status ?? "not-started"}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-2.5">
          <p className="t-small font-medium text-text-1">
            Checkpoint{required ? <span className="ml-1.5 font-normal text-text-2">· required</span> : null}
          </p>
          {state?.status === "skipped" ? <span className="t-small text-text-2">Skipped</span> : <CheckpointChip status={status} />}
        </div>
        <div className="space-y-3 px-4 py-3.5">
          <div className="flex items-center gap-2 rounded-[10px] border border-line bg-black px-3 py-2">
            <code className="min-w-0 flex-1 truncate font-mono text-[13px] text-text-1">
              <span className="text-text-3">$ </span>
              {cmd}
            </code>
            <CopyButton text={cmd} />
          </div>
          <p className="t-small text-text-2">
            Passes when you see <span className="font-mono text-text-1">{pass}</span>
          </p>
          {children ? <div className="prose-bp t-small">{children}</div> : null}
          {pasting ? (
            <div className="space-y-2">
              <label htmlFor={`${id}-out`} className="t-small text-text-2">
                Paste your output (optional, stored with your progress)
              </label>
              <Textarea id={`${id}-out`} value={output} onChange={(e) => setOutput(e.target.value)} className="font-mono text-[12.5px]" rows={4} />
            </div>
          ) : null}
          {error ? (
            <p role="alert" className="t-small text-failed">
              {error}
            </p>
          ) : null}
          {state?.status !== "passed" ? (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => mark("passed")} disabled={busy} data-action="mark-passed">
                Mark as passed
              </Button>
              {!pasting ? (
                <Button size="sm" variant="secondary" onClick={() => (nb?.requireAuth(id) ? setPasting(true) : undefined)}>
                  Paste output
                </Button>
              ) : null}
              {!required && state?.status !== "skipped" ? (
                <Button size="sm" variant="ghost" onClick={() => mark("skipped")} disabled={busy}>
                  Skip
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <p className="t-small text-text-2">Nice. Keep going.</p>
              <Button size="sm" variant="ghost" onClick={() => setPasting((p) => !p)}>
                {pasting ? "Hide output" : output ? "View output" : "Add output"}
              </Button>
              {pasting ? (
                <Button size="sm" variant="secondary" onClick={() => mark("passed")} disabled={busy}>
                  Save output
                </Button>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </CellFrame>
  );
}
