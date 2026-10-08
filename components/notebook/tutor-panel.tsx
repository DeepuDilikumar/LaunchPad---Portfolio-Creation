"use client";

import { useEffect, useRef, useState } from "react";
import { Button, LinkButton } from "@/components/ui/button";
import { Textarea } from "@/components/ui/inputs";
import { CopyButton } from "@/components/ui/copy-button";
import { ThinkingDots } from "./views";
import { useNotebook } from "./context";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

function cellLabel(id: string | null) {
  if (!id) return null;
  const el = document.getElementById(`cell-${id}`);
  const kind = el?.dataset.kind ?? "cell";
  const text = (el?.querySelector("label, p, pre")?.textContent ?? "").trim().replace(/\s+/g, " ");
  return `${kind[0]!.toUpperCase()}${kind.slice(1)}${text ? `: ${text.slice(0, 64)}${text.length > 64 ? "…" : ""}` : ""}`;
}

/** Pull fenced blocks out of an answer so recovery prompts get their own copy button. */
function splitBlocks(text: string) {
  const parts: { type: "text" | "code"; value: string }[] = [];
  const re = /```[\w-]*\n([\s\S]*?)```/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push({ type: "text", value: text.slice(last, m.index) });
    parts.push({ type: "code", value: m[1]!.trim() });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ type: "text", value: text.slice(last) });
  return parts;
}

export function TutorPanel() {
  const nb = useNotebook();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [limit, setLimit] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [attached, setAttached] = useState<string | null>(nb.tutor.cellId);
  const [label, setLabel] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // The drawer was opened from a specific cell: attach it.
  const [lastOpened, setLastOpened] = useState(nb.tutor.cellId);
  if (lastOpened !== nb.tutor.cellId) {
    setLastOpened(nb.tutor.cellId);
    setAttached(nb.tutor.cellId);
  }
  useEffect(() => {
    queueMicrotask(() => setLabel(cellLabel(attached)));
  }, [attached]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  if (!nb.user) {
    return (
      <div className="p-5">
        <p className="t-body text-text-1">The tutor needs an account</p>
        <p className="mt-1 t-small text-text-2">Sign in so the tutor can see your module, your step and your saved progress.</p>
        <LinkButton href={`/login?next=${encodeURIComponent(`/learn/${nb.project}/${nb.module}`)}`} className="mt-4" size="sm">
          Sign in
        </LinkButton>
      </div>
    );
  }

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setErr(null);
    setBusy(true);
    const history = [...messages, { role: "user" as const, content: text }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    try {
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          project: nb.project,
          module: nb.module,
          cellId: attached,
          tool: nb.tool,
          messages: history.slice(-8),
        }),
      });
      if (res.status === 429) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setLimit(data.error ?? "You've reached today's tutor limit.");
        setMessages(history);
        return;
      }
      if (!res.ok || !res.body) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setErr(data.error ?? "The tutor couldn't answer just now. Try again in a moment.");
        setMessages(history);
        return;
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setMessages([...history, { role: "assistant", content: acc }]);
      }
    } catch {
      setErr("The connection dropped. Your message wasn't lost; send it again.");
      setMessages(history);
      setInput(text);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4" role="log" aria-live="polite" aria-busy={busy}>
        {messages.length === 0 ? (
          <div className="rounded-[14px] border border-line bg-bg/40 p-3.5">
            <p className="t-small text-text-1">Paste the error or the diff you&apos;re stuck on.</p>
            <p className="mt-1 t-small text-text-2">The tutor sees this module and the step below. It answers with a diagnosis and a recovery prompt you can give your agent.</p>
          </div>
        ) : null}
        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="ml-auto max-w-[88%] whitespace-pre-wrap rounded-[14px] rounded-br-[4px] bg-surface-3 px-3.5 py-2.5 text-[14px] leading-[21px] text-text-1">
              {m.content}
            </div>
          ) : (
            <div key={i} className="max-w-[96%] space-y-2 text-[14px] leading-[22px] text-text-1" data-tutor-reply>
              {m.content ? (
                splitBlocks(m.content).map((p, j) =>
                  p.type === "code" ? (
                    <div key={j} className="rounded-[12px] theme-dark border border-line bg-bg">
                      <div className="flex items-center justify-between border-b border-line px-3 py-1.5">
                        <span className="t-small text-text-2">Recovery prompt</span>
                        <CopyButton text={p.value} />
                      </div>
                      <pre className="whitespace-pre-wrap px-3 py-2.5 font-mono text-[12.5px] leading-[20px]">{p.value}</pre>
                    </div>
                  ) : (
                    <p key={j} className="whitespace-pre-wrap">
                      {p.value.trim()}
                    </p>
                  ),
                )
              ) : (
                <ThinkingDots />
              )}
            </div>
          ),
        )}
        {limit ? (
          <p role="alert" className="rounded-[12px] border border-line bg-surface-2 p-3 t-small text-text-1" data-tutor-limit>
            {limit}
          </p>
        ) : null}
        {err ? (
          <p role="alert" className="t-small text-failed">
            {err}
          </p>
        ) : null}
        <div ref={endRef} />
      </div>
      <form
        className="border-t border-line p-3"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        {attached && label ? (
          <div className="mb-2 flex items-center justify-between gap-2 rounded-[10px] bg-surface-2 px-2.5 py-1.5" data-tutor-attached={attached}>
            <span className="min-w-0 truncate text-[12px] text-text-2">Attached: {label}</span>
            <button type="button" onClick={() => setAttached(null)} className="text-[12px] text-text-2 hover:text-text-1">
              Remove
            </button>
          </div>
        ) : null}
        <label htmlFor="tutor-input" className="sr-only">
          Message the tutor
        </label>
        <Textarea
          id="tutor-input"
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              void send();
            }
          }}
          placeholder="Paste your error, or describe what the agent did"
          rows={3}
          maxLength={8000}
          className="min-h-[84px]"
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[11.5px] text-text-3">⌘/Ctrl + Enter to send</span>
          <Button type="submit" size="sm" disabled={busy || !input.trim() || !!limit}>
            {busy ? "Thinking…" : "Send"}
          </Button>
        </div>
      </form>
    </div>
  );
}
