import Link from "next/link"

import { cn } from "@/lib/utils"

/** Brand mark: an upward chevron on a launch pad, drawn in the accent colour. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("size-7", className)}
      aria-hidden
      focusable="false"
    >
      <rect width="32" height="32" rx="8" className="fill-primary" />
      <path
        d="M10 17.5 16 11.5l6 6"
        fill="none"
        stroke="white"
        strokeWidth="2.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10 22.5h12" stroke="white" strokeWidth="2.75" strokeLinecap="round" />
    </svg>
  )
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "-m-2 inline-flex items-center gap-2 rounded-md p-2 text-[1.0625rem] font-semibold tracking-tight",
        className
      )}
    >
      <LogoMark />
      <span>LaunchPad</span>
      <span className="sr-only">— home</span>
    </Link>
  )
}
