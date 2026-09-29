"use client"

import "./globals.css"

/** Last-resort boundary if the root layout itself fails. Kept dependency-light on purpose. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en-IN">
      <body className="flex min-h-dvh items-center justify-center bg-background px-4 text-foreground">
        <div role="alert" className="max-w-md text-center">
          <h1 className="text-h2 font-semibold">LaunchPad hit a problem</h1>
          <p className="mt-2 text-muted-foreground">
            Please try again. If it keeps happening, reload the page in a minute.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-6 h-12 rounded-md bg-primary px-5 font-semibold text-primary-foreground hover:bg-primary-hover"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
