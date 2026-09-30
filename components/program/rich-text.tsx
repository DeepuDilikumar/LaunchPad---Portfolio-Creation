import { Fragment } from "react"

/** Renders `backtick` spans as inline code. Everything else is plain text. */
export function RichText({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`)/g)
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("`") && part.endsWith("`") ? (
          <code key={i} className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.875em] [overflow-wrap:anywhere]">
            {part.slice(1, -1)}
          </code>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        )
      )}
    </>
  )
}
