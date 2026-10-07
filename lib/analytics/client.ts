"use client";

import type { AnalyticsEvent } from "./events";
import { getConsent } from "./consent";

/**
 * Client-side tracking. Funnel-critical events are also counted server-side (no PII,
 * no cookies) so the admin funnel works without analytics consent. Third-party
 * analytics (PostHog) only receives events after the visitor accepts cookies.
 */
export function track(event: AnalyticsEvent, props: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  try {
    const body = JSON.stringify({ event, props: { ...props, path: location.pathname } });
    if (navigator.sendBeacon) navigator.sendBeacon("/api/events", new Blob([body], { type: "application/json" }));
    else void fetch("/api/events", { method: "POST", body, headers: { "content-type": "application/json" }, keepalive: true });
  } catch {
    // never break the UI for analytics
  }
  if (getConsent() === "all") {
    const ph = (window as unknown as { posthog?: { capture: (e: string, p: object) => void } }).posthog;
    ph?.capture(event, props);
  }
  if (process.env.NODE_ENV === "development") console.debug("[track]", event, props);
}
