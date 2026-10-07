"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { IconCheck, IconCopy } from "./icons";

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for non-secure contexts.
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
}

export function CopyButton({
  text,
  label = "Copy",
  copiedLabel = "Copied",
  onCopied,
  className,
  variant = "chip",
  ...rest
}: {
  text: string;
  label?: string;
  copiedLabel?: string;
  onCopied?: () => void;
  className?: string;
  variant?: "chip" | "pill";
  "data-copy"?: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      {...rest}
      onClick={async () => {
        await copyText(text);
        setCopied(true);
        onCopied?.();
        window.setTimeout(() => setCopied(false), 1600);
      }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium transition-colors",
        variant === "chip"
          ? "h-7 px-2.5 text-[12px] bg-surface-2 text-text-1 hover:bg-surface-3"
          : "h-10 px-[18px] text-[15px] bg-surface-2 text-text-1 hover:bg-surface-3",
        className,
      )}
    >
      {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
      <span aria-live="polite">{copied ? copiedLabel : label}</span>
    </button>
  );
}
