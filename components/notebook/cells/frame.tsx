"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useNotebookOptional } from "../context";

/** Wraps every top-level cell: anchor for keyboard nav, resume and "touched" tracking. */
export function CellFrame({
  id,
  kind,
  children,
  className,
}: {
  id: string;
  kind: string;
  children: ReactNode;
  className?: string;
}) {
  const nb = useNotebookOptional();
  const active = nb?.activeCell === id;
  return (
    <div
      id={`cell-${id}`}
      data-cell={id}
      data-kind={kind}
      tabIndex={-1}
      onPointerDown={() => nb?.touch(id)}
      onFocusCapture={() => nb?.setActiveCell(id)}
      className={cn(
        "relative scroll-mt-24 outline-none",
        "before:absolute before:-left-4 before:top-2 before:bottom-2 before:w-px before:rounded-full before:transition-colors md:before:-left-6",
        active ? "before:bg-text-3" : "before:bg-transparent",
        className,
      )}
    >
      {children}
    </div>
  );
}
