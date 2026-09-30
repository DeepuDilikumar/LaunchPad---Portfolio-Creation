"use client"

import { FileText } from "lucide-react"
import { useId, type ComponentProps, type ReactNode } from "react"

import { cn } from "@/lib/utils"

/** Outlined text inputs (Material 3 style): visible label, helper text, inline error. */
export const inputClass =
  "h-12 w-full min-w-0 rounded-xl border border-input bg-card px-4 text-base text-foreground transition-[border-color,box-shadow] duration-(--dur-fast) placeholder:text-muted-foreground/80 hover:border-foreground/60 focus-visible:border-primary focus-visible:shadow-[inset_0_0_0_1px_var(--primary)] focus-visible:outline-none aria-invalid:border-danger aria-invalid:shadow-[inset_0_0_0_1px_var(--danger)] disabled:opacity-60"

export function AutofillTag({ source }: { source?: "resume" | "llm" | "user" }) {
  if (source !== "resume" && source !== "llm") return null
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-tonal px-2 py-0.5 text-[0.75rem] font-medium text-tonal-foreground">
      <FileText className="size-3" aria-hidden />
      From your resume
    </span>
  )
}

export function Field({
  label,
  hint,
  error,
  required,
  source,
  children,
  className,
  htmlFor,
}: {
  label: string
  hint?: ReactNode
  error?: string
  required?: boolean
  source?: "resume" | "llm" | "user"
  children: (props: { id: string; describedBy?: string; invalid: boolean }) => ReactNode
  className?: string
  htmlFor?: string
}) {
  const autoId = useId()
  const id = htmlFor ?? autoId
  const hintId = `${id}-hint`
  const describedBy = error || hint ? hintId : undefined
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
          {required ? <span className="text-danger"> *</span> : null}
        </label>
        <AutofillTag source={source} />
      </div>
      {children({ id, describedBy, invalid: Boolean(error) })}
      {error ? (
        <p id={hintId} className="text-caption text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-caption text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

export function TextInput({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(inputClass, className)} {...props} />
}

export function TextArea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(inputClass, "h-auto min-h-24 resize-y py-3 leading-relaxed", className)}
      {...props}
    />
  )
}
