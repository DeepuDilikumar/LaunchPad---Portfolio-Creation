"use client";

type Gtag = (cmd: "event", name: string, params?: Record<string, unknown>) => void;
type Fbq = (
  cmd: "track" | "trackCustom",
  name: string,
  params?: Record<string, unknown>,
  opts?: { eventID?: string },
) => void;

/** Fires a GA4 event (and the matching Meta Pixel event where one exists). No-ops without consent or IDs. */
export function track(
  name: string,
  params: Record<string, unknown> = {},
  opts: { eventId?: string } = {},
): void {
  if (typeof window === "undefined") return;
  const w = window as unknown as { gtag?: Gtag; fbq?: Fbq };
  w.gtag?.("event", name, params);
  const meta: Record<string, string> = {
    begin_checkout: "InitiateCheckout",
    purchase: "Purchase",
    generate_lead: "Lead",
    view_item: "ViewContent",
  };
  if (meta[name])
    w.fbq?.("track", meta[name], params, opts.eventId ? { eventID: opts.eventId } : undefined);
  else if (name.startsWith("check_")) w.fbq?.("trackCustom", name, params);
}
