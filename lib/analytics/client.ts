"use client"

/**
 * Product analytics from the browser: our own events table + Meta Pixel (when configured).
 * Props must never contain personal data or resume content: only counts, keys and flags.
 */
export type EventName =
  | "upload"
  | "portfolio_created"
  | "teaser_viewed"
  | "checkout_started"
  | "paid"
  | "day_completed"

type Props = Record<string, string | number | boolean>

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
  }
}

const PIXEL_EVENTS: Partial<Record<EventName, string>> = {
  upload: "Lead",
  portfolio_created: "CompleteRegistration",
  checkout_started: "InitiateCheckout",
  paid: "Purchase",
}

function anonId() {
  try {
    let id = window.localStorage.getItem("launchpad_anon_id")
    if (!id) {
      id = crypto.randomUUID()
      window.localStorage.setItem("launchpad_anon_id", id)
    }
    return id
  } catch {
    return "unknown"
  }
}

export function track(name: EventName, props: Props = {}) {
  try {
    const body = JSON.stringify({ name, props, anonId: anonId() })
    if (!navigator.sendBeacon?.("/api/events", new Blob([body], { type: "application/json" }))) {
      void fetch("/api/events", { method: "POST", body, headers: { "content-type": "application/json" }, keepalive: true })
    }
    const pixelName = PIXEL_EVENTS[name]
    if (pixelName && window.fbq) {
      const pixelProps =
        name === "paid" && typeof props.amountRupees === "number"
          ? { value: props.amountRupees, currency: "INR" }
          : {}
      window.fbq("track", pixelName, pixelProps)
    }
  } catch {
    // Analytics must never break the product.
  }
}
