/**
 * Presentational notebook pieces shared by the real notebook cells and the landing demos,
 * so the marketing site shows the actual product UI.
 */
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { StatusChip, type Status } from "@/components/ui/pill";

export function CellShell({
  label,
  right,
  children,
  className,
  tone = "card",
  ...rest
}: {
  label?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  tone?: "card" | "plain";
  id?: string;
  "data-cell"?: string;
  tabIndex?: number;
}) {
  return (
    <div
      className={cn(
        tone === "card" ? "rounded-[16px] border border-line bg-surface-1" : "",
        "outline-none",
        className,
      )}
      {...rest}
    >
      {label || right ? (
        <div className="flex min-h-10 items-center justify-between gap-3 border-b border-line px-4 py-1.5">
          <div className="flex items-center gap-2 t-small text-text-2">{label}</div>
          {right ? <div className="flex items-center gap-2">{right}</div> : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}

export function TerminalView({
  lines,
  className,
  title = "Terminal",
}: {
  lines: { text: string; tone?: "muted" | "passed" | "failed" | "cmd" | "default" }[];
  className?: string;
  title?: string;
}) {
  return (
    <div className={cn("theme-dark rounded-[14px] border border-line bg-bg", className)}>
      <div className="flex h-8 items-center gap-2 border-b border-line px-3 t-small text-text-3">
        <span aria-hidden className="font-mono text-[11px]">❯_</span>
        {title}
      </div>
      <pre className="whitespace-pre-wrap break-words px-3.5 py-3 font-mono text-[12.5px] leading-[20px]">
        {lines.map((l, i) => (
          <div
            key={i}
            className={cn(
              l.tone === "muted" && "text-text-2",
              l.tone === "passed" && "text-passed",
              l.tone === "failed" && "text-failed",
              l.tone === "cmd" && "text-text-1",
              (!l.tone || l.tone === "default") && "text-text-1",
            )}
          >
            {l.tone === "cmd" ? <span className="text-text-3">$ </span> : null}
            {l.text}
          </div>
        ))}
      </pre>
    </div>
  );
}

export function CheckpointChip({ status }: { status: Status }) {
  const label = status === "passed" ? "Passed" : status === "working" ? "Working" : status === "failed" ? "Failed" : "Not started";
  return <StatusChip status={status}>{label}</StatusChip>;
}

export function ThinkingDots({ className }: { className?: string }) {
  return (
    <span role="status" className={cn("inline-flex items-center gap-1", className)}>
      <span className="sr-only">Thinking</span>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          aria-hidden
          className="size-1.5 rounded-full bg-text-2"
          style={{ animation: `dot-pulse 1.2s ${i * 0.16}s infinite ease-in-out` }}
        />
      ))}
    </span>
  );
}

export function ToolTabsView({ tools, active }: { tools: string[]; active: string }) {
  return (
    <div className="flex items-center gap-1" aria-hidden>
      {tools.map((t) => (
        <span
          key={t}
          className={cn(
            "rounded-full px-2.5 h-6 inline-flex items-center t-badge",
            t === active ? "bg-surface-3 text-text-1" : "text-text-2",
          )}
        >
          {t}
        </span>
      ))}
    </div>
  );
}
