"use client";

import { useId, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/cn";

export function Accordion({
  items,
  className,
}: {
  items: { q: string; a: ReactNode }[];
  className?: string;
}) {
  return (
    <div className={cn("divide-y divide-line border-y border-line", className)}>
      {items.map((it) => (
        <AccordionItem key={it.q} title={it.q}>
          {it.a}
        </AccordionItem>
      ))}
    </div>
  );
}

export function AccordionItem({ title, children, defaultOpen = false }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <div>
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          id={`${id}-btn`}
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between gap-6 py-5 text-left t-h3 text-text-1"
        >
          {title}
          <span aria-hidden className={cn("relative size-4 shrink-0 transition-transform duration-300", open && "rotate-45")}>
            <span className="absolute left-0 top-1/2 h-px w-4 -translate-y-1/2 bg-text-2" />
            <span className="absolute left-1/2 top-0 h-4 w-px -translate-x-1/2 bg-text-2" />
          </span>
        </button>
      </h3>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            id={`${id}-panel`}
            role="region"
            aria-labelledby={`${id}-btn`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="pb-6 pr-10 t-body text-text-2 max-w-[70ch]">{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
