"use client";

import { useState, type ReactNode } from "react";

export interface ViewerPage {
  id: string;
  label: string;
  tag: string;
  short: string;
}

/** Pick a page on the left, read it in full on the right. Pages are server-rendered QuestionPages. */
export function PageViewer({
  pages,
  children,
  moreNote,
}: {
  pages: ViewerPage[];
  children: ReactNode[];
  moreNote?: string;
}) {
  const [index, setIndex] = useState(0);
  return (
    <div className="flex flex-wrap items-start gap-7">
      <div
        className="flex min-w-0 flex-[1_1_250px] flex-col gap-3"
        role="tablist"
        aria-label="Sample pages"
      >
        {pages.map((p, i) => {
          const on = i === index;
          return (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={on}
              aria-controls={`page-${p.id}`}
              onClick={() => setIndex(i)}
              className={`text-ink flex min-h-11 cursor-pointer flex-col gap-1 rounded-[10px] border-[1.5px] px-3.5 py-3 text-left ${on ? "border-blue bg-card shadow-[4px_4px_0_var(--blue)]" : "border-chip bg-card/55"}`}
            >
              <span className="text-muted font-mono text-[11px]">
                {p.label} · {p.tag}
              </span>
              <span className="text-[15px] leading-snug font-semibold">{p.short}</span>
            </button>
          );
        })}
        {moreNote ? (
          <span className="hand text-red mt-1.5 -rotate-3 text-[22px] max-md:hidden">
            {moreNote}
          </span>
        ) : null}
      </div>
      <div className="paper-sheet min-w-0 flex-[999_1_560px] px-5 py-8 sm:px-11 sm:py-10">
        {children.map((child, i) => (
          <div key={pages[i].id} id={`page-${pages[i].id}`} role="tabpanel" hidden={i !== index}>
            {child}
          </div>
        ))}
      </div>
    </div>
  );
}
