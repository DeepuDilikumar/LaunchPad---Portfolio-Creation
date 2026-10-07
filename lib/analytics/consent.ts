/** Cookie consent, stored as a first-party cookie so the server can read it too. */
export type Consent = "all" | "essential";

export const CONSENT_COOKIE = "bp_consent";
const listeners = new Set<() => void>();

export function getConsent(): Consent | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${CONSENT_COOKIE}=(all|essential)`));
  return (m?.[1] as Consent | undefined) ?? null;
}

export function setConsent(c: Consent) {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CONSENT_COOKIE}=${c}; Path=/; Max-Age=${60 * 60 * 24 * 180}; SameSite=Lax${secure}`;
  listeners.forEach((l) => l());
}

export function subscribeConsent(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
