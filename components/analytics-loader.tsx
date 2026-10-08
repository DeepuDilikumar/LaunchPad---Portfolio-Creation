"use client";

import { useEffect, useSyncExternalStore } from "react";
import { getConsent, subscribeConsent } from "@/lib/analytics/consent";

const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

/** Loads PostHog only after the visitor accepts analytics cookies, and only when a key is configured. */
export function AnalyticsLoader() {
  const consent = useSyncExternalStore(subscribeConsent, getConsent, () => null);
  useEffect(() => {
    if (!key || consent !== "all") return;
    let cancelled = false;
    void import("posthog-js").then(({ default: posthog }) => {
      if (cancelled) return;
      posthog.init(key, { api_host: host, person_profiles: "identified_only", capture_pageview: true, persistence: "localStorage+cookie" });
      (window as unknown as { posthog: typeof posthog }).posthog = posthog;
    });
    return () => {
      cancelled = true;
    };
  }, [consent]);
  useEffect(() => {
    if (consent === "essential") (window as unknown as { posthog?: { opt_out_capturing: () => void } }).posthog?.opt_out_capturing();
  }, [consent]);
  return null;
}
