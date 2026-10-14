import type { Utm } from "./db/types";

export const UTM_COOKIE = "sq_utm";
export const REF_COOKIE = "sq_ref";
const KEYS = ["source", "medium", "campaign", "content", "term"] as const;

/** Reads utm_* params from a URL. Null when there are none. */
export function utmFromUrl(url: URL): Utm | null {
  const utm: Utm = {};
  for (const k of KEYS) {
    const v = url.searchParams.get(`utm_${k}`);
    if (v) utm[k] = v.slice(0, 100);
  }
  if (!Object.keys(utm).length) return null;
  utm.landing = url.pathname.slice(0, 100);
  return utm;
}

export function parseUtmCookie(value: string | undefined): Utm {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    const out: Utm = {};
    for (const k of [...KEYS, "landing"] as const)
      if (typeof parsed[k] === "string") out[k] = (parsed[k] as string).slice(0, 100);
    return out;
  } catch {
    return {};
  }
}
