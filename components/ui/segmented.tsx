"use client";

import { useId, type KeyboardEvent } from "react";
import { m } from "motion/react";
import { cn } from "@/lib/cn";

/** A radio group styled as a segmented toggle. Lives inside cards. */
export function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
  size = "md",
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  className?: string;
  size?: "md" | "sm";
}) {
  const id = useId();
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = options.findIndex((o) => o.value === value);
    let next = i;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (i + 1) % options.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (i - 1 + options.length) % options.length;
    else return;
    e.preventDefault();
    const opt = options[next];
    if (opt) {
      onChange(opt.value);
      const el = document.getElementById(`${id}-${next}`);
      el?.focus();
    }
  };
  return (
    <div
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKey}
      className={cn("relative inline-flex rounded-full bg-surface-2 p-1", className)}
    >
      {options.map((o, i) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            id={`${id}-${i}`}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(o.value)}
            className={cn(
              "relative z-10 rounded-full font-medium transition-colors duration-200",
              size === "md" ? "h-8 px-3.5 text-[13px]" : "h-7 px-3 text-[12px]",
              active ? "text-invert-text" : "text-text-2 hover:text-text-1",
            )}
          >
            {active ? (
              <m.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 -z-10 rounded-full bg-invert"
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              />
            ) : null}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
