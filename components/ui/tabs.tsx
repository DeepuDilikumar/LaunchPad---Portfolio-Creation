"use client";

import { useId, useRef, type KeyboardEvent, type ReactNode } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/cn";

export interface TabItem<T extends string> {
  value: T;
  label: ReactNode;
  dot?: string;
}

/**
 * ARIA tablist. Renders the tab row only; render the panel yourself with
 * `id={panelId(value)}` and `aria-labelledby={tabId(value)}`, or use <TabPanel>.
 */
export function Tabs<T extends string>({
  items,
  value,
  onChange,
  label,
  variant = "underline",
  className,
  idBase,
}: {
  items: TabItem<T>[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  variant?: "underline" | "pill";
  className?: string;
  idBase?: string;
}) {
  const gen = useId();
  const base = idBase ?? gen;
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKey = (e: KeyboardEvent) => {
    const i = items.findIndex((t) => t.value === value);
    let next = i;
    if (e.key === "ArrowRight") next = (i + 1) % items.length;
    else if (e.key === "ArrowLeft") next = (i - 1 + items.length) % items.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = items.length - 1;
    else return;
    e.preventDefault();
    const it = items[next];
    if (it) {
      onChange(it.value);
      refs.current[next]?.focus();
    }
  };

  return (
    <div
      role="tablist"
      aria-label={label}
      onKeyDown={onKey}
      className={cn(
        variant === "underline" ? "flex gap-1 border-b border-line" : "flex flex-wrap justify-center gap-2",
        className,
      )}
    >
      {items.map((t, i) => {
        const active = t.value === value;
        return (
          <button
            key={t.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            id={`${base}-tab-${t.value}`}
            role="tab"
            type="button"
            aria-selected={active}
            aria-controls={`${base}-panel-${t.value}`}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(t.value)}
            className={cn(
              "relative inline-flex items-center gap-2 font-medium transition-colors duration-200",
              variant === "underline"
                ? cn("h-9 px-3 text-[13px]", active ? "text-text-1" : "text-text-2 hover:text-text-1")
                : cn("h-10 rounded-full px-4 text-[14px]", active ? "text-text-1" : "text-text-2 hover:text-text-1 bg-surface-1"),
            )}
          >
            {active ? (
              <motion.span
                layoutId={`tab-${base}`}
                aria-hidden
                className={cn(
                  "absolute",
                  variant === "underline" ? "inset-x-2 -bottom-px h-px bg-text-1" : "inset-0 -z-0 rounded-full bg-surface-3",
                )}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              />
            ) : null}
            {t.dot ? <span aria-hidden className="relative z-10 size-2 rounded-full" style={{ background: t.dot }} /> : null}
            <span className="relative z-10">{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function TabPanel({
  idBase,
  value,
  children,
  className,
}: {
  idBase: string;
  value: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div role="tabpanel" id={`${idBase}-panel-${value}`} aria-labelledby={`${idBase}-tab-${value}`} tabIndex={0} className={className}>
      {children}
    </div>
  );
}
