"use client"

import { Loader2, Send } from "lucide-react"
import { useEffect, useRef, useState, type FormEvent } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type ChatMessage = { role: "user" | "assistant"; content: string }

const STARTERS = ["I'm stuck on step 1. Where do I start?", "Can you explain the main idea behind today's task?", "How do I test that this works?"]

export function MentorChat({ day, initial, aiEnabled }: { day: number; initial: ChatMessage[]; aiEnabled: boolean }) {
  const [messages, setMessages] = useState<ChatMessage[]>(initial)
  const [input, setInput] = useState("")
  const [busy, setBusy] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" })
  }, [messages])

  async function send(text: string) {
    const message = text.trim()
    if (!message || busy) return
    setInput("")
    setBusy(true)
    setMessages((m) => [...m, { role: "user", content: message }, { role: "assistant", content: "" }])
    try {
      const r = await fetch("/api/mentor", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ day, message }),
      })
      if (!r.ok || !r.body) {
        const data = await r.json().catch(() => null)
        throw new Error(data?.error?.message ?? "The mentor couldn't answer. Please try again.")
      }
      const reader = r.body.getReader()
      const decoder = new TextDecoder()
      for (;;) {
        const { value, done } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        setMessages((m) => {
          const copy = [...m]
          copy[copy.length - 1] = { role: "assistant", content: copy[copy.length - 1].content + chunk }
          return copy
        })
      }
    } catch (e) {
      setMessages((m) => {
        const copy = [...m]
        copy[copy.length - 1] = { role: "assistant", content: e instanceof Error ? e.message : "Something went wrong." }
        return copy
      })
    } finally {
      setBusy(false)
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    void send(input)
  }

  return (
    <div className="flex min-h-[50dvh] flex-col">
      {!aiEnabled ? (
        <p className="mb-3 rounded-xl bg-tonal p-3 text-caption text-tonal-foreground">
          The AI mentor isn&apos;t switched on for this server yet. You&apos;ll get today&apos;s hints instead.
        </p>
      ) : null}
      <div className="flex flex-1 flex-col gap-3" aria-live="polite">
        {messages.length === 0 ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              Ask about a concept, an error, or what to do next. The mentor explains and nudges; it won&apos;t write the whole thing for you.
            </p>
            {STARTERS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => void send(s)}
                className="rounded-xl border border-border px-3 py-2.5 text-left text-sm hover:bg-muted"
              >
                {s}
              </button>
            ))}
          </div>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              className={cn(
                "max-w-[90%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
                m.role === "user" ? "self-end bg-primary text-primary-foreground" : "self-start bg-surface"
              )}
            >
              {m.content || <Loader2 className="size-4 animate-spin" aria-label="Thinking" />}
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>
      <form onSubmit={onSubmit} className="sticky bottom-0 mt-4 flex items-end gap-2 bg-popover pt-2">
        <label htmlFor={`mentor-input-${day}`} className="sr-only">
          Your question
        </label>
        <textarea
          id={`mentor-input-${day}`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              void send(input)
            }
          }}
          rows={1}
          placeholder="Ask the mentor…"
          className="max-h-32 min-h-12 flex-1 resize-none rounded-2xl border border-input bg-card px-4 py-3 text-base outline-none focus-visible:border-primary"
        />
        <Button type="submit" size="icon" disabled={busy || !input.trim()} aria-label="Send">
          {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />}
        </Button>
      </form>
    </div>
  )
}
