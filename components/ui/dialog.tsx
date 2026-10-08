"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Modal built on the native <dialog> element: focus trap, Escape to close and
 * inert background come from the platform.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  className,
  variant = "center",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
  variant?: "center" | "sheet" | "drawer";
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const uid = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const onCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    d.addEventListener("cancel", onCancel);
    return () => d.removeEventListener("cancel", onCancel);
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={`${uid}-title`}
      aria-describedby={description ? `${uid}-desc` : undefined}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className={cn(
        "m-0 max-h-none max-w-none bg-transparent p-0 text-text-1 backdrop:bg-black/70 backdrop:backdrop-blur-sm",
        variant === "center" && "fixed inset-0 m-auto h-fit w-[calc(100%-32px)] max-w-[440px]",
        variant === "sheet" && "fixed inset-x-0 bottom-0 top-auto w-full",
        variant === "drawer" && "fixed inset-y-0 right-0 left-auto h-full w-full max-w-[440px]",
      )}
    >
      {open ? (
        <div
          className={cn(
            "border border-line bg-surface-1",
            variant === "center" && "rounded-[24px] p-6 md:p-8",
            variant === "sheet" && "rounded-t-[24px] p-5 pb-8 max-h-[85vh] overflow-y-auto",
            variant === "drawer" && "h-full overflow-y-auto p-5",
            className,
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id={`${uid}-title`} className="t-h3 text-text-1">
                {title}
              </h2>
              {description ? (
                <p id={`${uid}-desc`} className="mt-1.5 t-small text-text-2">
                  {description}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="-mr-2 -mt-1 inline-flex size-8 items-center justify-center rounded-full text-text-2 hover:bg-surface-2 hover:text-text-1"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
                <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <div className="mt-5">{children}</div>
        </div>
      ) : null}
    </dialog>
  );
}
