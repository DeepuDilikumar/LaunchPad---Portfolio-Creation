"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { CopyButton } from "@/components/ui/copy-button";
import { IconChevronDown } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { CellFrame } from "./frame";
import { useNotebookOptional } from "../context";

const ease = [0.22, 1, 0.36, 1] as const;

export function Pitfall({ id, title, recovery, children }: { id: string; title: string; recovery?: string; children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const nb = useNotebookOptional();
  const pid = useId();
  return (
    <CellFrame id={id} kind="pitfall">
      <div className="rounded-[16px] border border-line bg-surface-1">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={`${pid}-body`}
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        >
          <span className="t-small text-text-1">
            <span className="text-text-2">If the agent </span>
            {title}
          </span>
          <IconChevronDown size={14} className={cn("shrink-0 text-text-2 transition-transform duration-300", open && "rotate-180")} />
        </button>
        <AnimatePresence initial={false}>
          {open ? (
            <m.div
              id={`${pid}-body`}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease }}
              className="overflow-hidden"
            >
              <div className="space-y-3 border-t border-line px-4 py-3.5">
                {children ? <div className="prose-bp t-small">{children}</div> : null}
                {recovery ? (
                  <div className="theme-dark rounded-[12px] border border-line bg-bg">
                    <div className="flex items-center justify-between border-b border-line px-3 py-1.5">
                      <span className="t-small text-text-2">Recovery prompt</span>
                      <CopyButton text={recovery.trim()} onCopied={() => nb?.promptCopied(id)} />
                    </div>
                    <pre className="whitespace-pre-wrap px-3 py-2.5 font-mono text-[12.5px] leading-[20px] text-text-1">{recovery.trim()}</pre>
                  </div>
                ) : null}
                {nb ? (
                  <button type="button" onClick={() => nb.openTutor(id)} className="t-small text-text-2 underline decoration-line-strong underline-offset-4 hover:text-text-1">
                    Still stuck? Ask the tutor about this step
                  </button>
                ) : null}
              </div>
            </m.div>
          ) : null}
        </AnimatePresence>
      </div>
    </CellFrame>
  );
}

export function Interview({ id, q, children }: { id: string; q: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const aid = useId();
  return (
    <CellFrame id={id} kind="interview">
      <div className="rounded-[16px] border border-line bg-surface-1 px-4 py-3.5">
        <p className="t-small text-text-2">Interview question</p>
        <p className="mt-1 t-body text-text-1">{q}</p>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={aid}
          onClick={() => setOpen((o) => !o)}
          className="mt-3 inline-flex h-8 items-center rounded-full bg-surface-2 px-3.5 text-[13px] font-medium text-text-1 hover:bg-surface-3"
        >
          {open ? "Hide the answer" : "Show a strong answer"}
        </button>
        <div id={aid} hidden={!open} className="prose-bp t-small mt-3 border-l border-line-strong pl-3.5">
          {children}
        </div>
      </div>
    </CellFrame>
  );
}

export function Quiz({ id, question, options, answer, why }: { id: string; question?: string; options: string[]; answer: number; why: string }) {
  const [picked, setPicked] = useState<number | null>(null);
  const name = useId();
  const correct = picked === answer;
  return (
    <CellFrame id={id} kind="quiz">
      <fieldset className="rounded-[16px] border border-line bg-surface-1 px-4 py-3.5">
        <legend className="sr-only">{question ?? "Quick check"}</legend>
        <p className="t-small text-text-2">Quick check</p>
        {question ? <p className="mt-1 t-body text-text-1">{question}</p> : null}
        <div className="mt-3 space-y-2">
          {options.map((o, i) => (
            <label
              key={o}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-[12px] border px-3 py-2.5 t-small transition-colors",
                picked === i ? (i === answer ? "border-passed/60 bg-passed/5" : "border-failed/60 bg-failed/5") : "border-line hover:bg-surface-2",
              )}
            >
              <input type="radio" name={name} className="mt-0.5 accent-[var(--text-1)]" checked={picked === i} onChange={() => setPicked(i)} />
              <span className="text-text-1">{o}</span>
            </label>
          ))}
        </div>
        <div aria-live="polite">
          {picked !== null ? (
            <p className="mt-3 t-small text-text-2">
              <span className={correct ? "text-passed" : "text-failed"}>{correct ? "Right. " : "Not quite. "}</span>
              {why}
            </p>
          ) : null}
        </div>
      </fieldset>
    </CellFrame>
  );
}

let mermaidLoader: Promise<typeof import("mermaid").default> | null = null;

export function Diagram({ id, chart, caption }: { id: string; chart: string; caption?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const did = useId().replace(/[^a-zA-Z0-9]/g, "");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let cancelled = false;
    const io = new IntersectionObserver(
      async ([e]) => {
        if (!e?.isIntersecting) return;
        io.disconnect();
        try {
          mermaidLoader ??= import("mermaid").then((m) => {
            m.default.initialize({
              startOnLoad: false,
              theme: "base",
              securityLevel: "strict",
              fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
              themeVariables: {
                darkMode: true,
                background: "#000000",
                primaryColor: "#1C1C1C",
                primaryTextColor: "#F5F5F5",
                primaryBorderColor: "#3a3a3a",
                lineColor: "#6b6b6b",
                secondaryColor: "#121212",
                tertiaryColor: "#121212",
                noteBkgColor: "#1C1C1C",
                noteTextColor: "#F5F5F5",
                fontSize: "14px",
              },
            });
            return m.default;
          });
          const mermaid = await mermaidLoader;
          const { svg } = await mermaid.render(`d${did}`, chart.trim());
          // Diagrams on public proof pages are learner-written: sanitize the SVG again on top of
          // Mermaid's strict mode before it touches the DOM.
          const DOMPurify = (await import("dompurify")).default;
          const clean = DOMPurify.sanitize(svg, { USE_PROFILES: { svg: true, svgFilters: true }, ADD_TAGS: ["foreignObject"], FORBID_TAGS: ["script", "style"] });
          if (!cancelled) setSvg(clean);
        } catch {
          if (!cancelled) setFailed(true);
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => {
      cancelled = true;
      io.disconnect();
    };
  }, [chart, did]);

  return (
    <CellFrame id={id} kind="diagram">
      <figure className="theme-dark rounded-[16px] border border-line bg-surface-1 p-4">
        <div ref={ref} className="flex min-h-[160px] items-center justify-center overflow-x-auto [&_svg]:max-w-full [&_svg]:h-auto">
          {svg ? (
            <div role="img" aria-label={caption ?? "Diagram"} dangerouslySetInnerHTML={{ __html: svg }} />
          ) : failed ? (
            <pre className="whitespace-pre-wrap font-mono text-[12px] text-text-2">{chart.trim()}</pre>
          ) : (
            <span className="t-small text-text-3">Loading diagram…</span>
          )}
        </div>
        {caption ? <figcaption className="mt-3 t-small text-text-2">{caption}</figcaption> : null}
        <details className="mt-2">
          <summary className="cursor-pointer t-small text-text-2 hover:text-text-1">Diagram as text</summary>
          <pre className="mt-2 whitespace-pre-wrap font-mono text-[12px] leading-[18px] text-text-2">{chart.trim()}</pre>
        </details>
      </figure>
    </CellFrame>
  );
}
