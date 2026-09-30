"use client"

import { Plus, X } from "lucide-react"
import { useState, type KeyboardEvent } from "react"

import { cn } from "@/lib/utils"

/**
 * Tag-style input: Enter or comma adds a chip, Backspace on an empty field removes the last.
 * Chips wrap; nothing scrolls sideways. Suggestions are optional one-tap adds.
 */
export function ChipInput({
  id,
  value,
  onChange,
  placeholder,
  suggestions = [],
  describedBy,
  label,
}: {
  id: string
  value: string[]
  onChange: (next: string[]) => void
  placeholder?: string
  suggestions?: string[]
  describedBy?: string
  label: string
}) {
  const [draft, setDraft] = useState("")

  function add(raw: string) {
    const items = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
    if (!items.length) return
    const lower = new Set(value.map((v) => v.toLowerCase()))
    const fresh = items.filter((i) => !lower.has(i.toLowerCase()))
    if (fresh.length) onChange([...value, ...fresh])
    setDraft("")
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault()
      add(draft)
    } else if (event.key === "Backspace" && !draft && value.length) {
      onChange(value.slice(0, -1))
    }
  }

  const unused = suggestions.filter((s) => !value.some((v) => v.toLowerCase() === s.toLowerCase())).slice(0, 6)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex min-h-12 flex-wrap items-center gap-1.5 rounded-xl border border-input bg-card px-2 py-2 focus-within:border-primary focus-within:shadow-[inset_0_0_0_1px_var(--primary)]">
        {value.map((chip) => (
          <span
            key={chip}
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-border bg-surface pr-1 pl-3 text-sm"
          >
            {chip}
            <button
              type="button"
              onClick={() => onChange(value.filter((v) => v !== chip))}
              className="-my-1 flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={`Remove ${chip} from ${label}`}
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => add(draft)}
          placeholder={value.length ? "Add more…" : placeholder}
          aria-describedby={describedBy}
          enterKeyHint="done"
          className="h-8 min-w-[8rem] flex-1 bg-transparent px-2 text-base outline-none placeholder:text-muted-foreground/80"
        />
      </div>
      {unused.length ? (
        <div className="flex flex-wrap gap-1.5" aria-label={`Suggested ${label}`}>
          {unused.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onChange([...value, s])}
              className={cn(
                "inline-flex h-9 items-center gap-1 rounded-lg border border-dashed border-border px-3 text-sm text-muted-foreground hover:border-primary hover:text-accent-text"
              )}
            >
              <Plus className="size-3.5" aria-hidden />
              {s}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
