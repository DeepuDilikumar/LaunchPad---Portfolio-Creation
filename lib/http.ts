import "server-only";
import { NextResponse } from "next/server";
import type { z } from "zod";

export function json<T>(data: T, init?: number | ResponseInit) {
  return NextResponse.json(data, typeof init === "number" ? { status: init } : init);
}

export function error(status: number, message: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

/** Parse and validate a JSON body. Returns [data, null] or [null, errorResponse]. */
export async function parseBody<S extends z.ZodType>(req: Request, schema: S): Promise<[z.infer<S>, null] | [null, NextResponse]> {
  const type = req.headers.get("content-type") ?? "";
  if (!type.toLowerCase().startsWith("application/json")) return [null, error(415, "Send the body as JSON (content-type: application/json).")];
  let raw: unknown;
  try {
    const text = await req.text();
    if (text.length > 64_000) return [null, error(413, "Request is too large.")];
    raw = text ? JSON.parse(text) : {};
  } catch {
    return [null, error(400, "Send a JSON body.")];
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return [null, error(400, "Some fields are missing or invalid.", { issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) })];
  }
  return [parsed.data, null];
}

/** Only allow same-origin relative paths as redirect targets. */
export function safeReturnTo(value: string | null | undefined, fallback = "/dashboard"): string {
  if (!value || typeof value !== "string" || value.length > 500) return fallback;
  // Browsers drop tabs/newlines and treat backslashes as slashes, so "/\t/evil.com" is "//evil.com".
  if (!value.startsWith("/") || /[\x00-\x1f\x7f\\]/.test(value)) return fallback;
  try {
    const u = new URL(value, "http://same.origin");
    if (u.origin !== "http://same.origin") return fallback;
    return `${u.pathname}${u.search}${u.hash}`;
  } catch {
    return fallback;
  }
}
