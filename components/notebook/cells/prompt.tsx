"use client";

import { useId } from "react";
import { features } from "@/config/features";
import { CopyButton } from "@/components/ui/copy-button";
import { Tabs, TabPanel } from "@/components/ui/tabs";
import { CellFrame } from "./frame";
import { useNotebookOptional, type Tool } from "../context";

const modeHints = {
  plan: "Run this in plan mode first. Review the plan before you let it write code.",
  build: "Run this once you're happy with the plan.",
  review: "Ask for a review, not changes. Read what it finds before acting on it.",
} as const;

const toolLabels: Record<Tool, string> = { claude: "Claude Code", codex: "Codex", cursor: "Cursor" };

function clean(s: string) {
  return s.replace(/^\n+|\s+$/g, "").replace(/^[ \t]+/gm, (m) => m);
}

export function Prompt({
  id,
  claude,
  codex,
  cursor,
  mode = "build",
}: {
  id: string;
  claude: string;
  codex: string;
  cursor?: string;
  mode?: keyof typeof modeHints;
}) {
  const nb = useNotebookOptional();
  const idBase = useId().replace(/:/g, "");
  const available: Tool[] = ["claude", "codex", ...(cursor && features.cursorPrompts ? (["cursor"] as Tool[]) : [])];
  const tool: Tool = nb && available.includes(nb.tool) ? nb.tool : "claude";
  const text = clean(tool === "claude" ? claude : tool === "codex" ? codex : (cursor ?? claude));

  return (
    <CellFrame id={id} kind="prompt">
      <div className="overflow-hidden rounded-[16px] border border-line bg-surface-1" data-prompt={id}>
        <div className="flex items-center justify-between gap-3 border-b border-line pl-2 pr-3">
          <Tabs
            idBase={idBase}
            label="Agent"
            className="border-b-0"
            value={tool}
            onChange={(t) => nb?.setTool(t)}
            items={available.map((t) => ({ value: t, label: toolLabels[t] }))}
          />
          <CopyButton text={text} onCopied={() => nb?.promptCopied(id)} data-copy="prompt" />
        </div>
        <TabPanel idBase={idBase} value={tool}>
          <pre className="whitespace-pre-wrap break-words px-4 py-3.5 font-mono text-[13px] leading-[21px] text-text-1">{text}</pre>
        </TabPanel>
        <p className="flex items-center gap-2 border-t border-line px-4 py-2 t-small text-text-2">
          <span className="rounded-full bg-surface-2 px-2 py-0.5 t-badge text-text-1">{mode === "plan" ? "Plan mode" : mode === "review" ? "Review" : "Build"}</span>
          {modeHints[mode]}
        </p>
      </div>
    </CellFrame>
  );
}
