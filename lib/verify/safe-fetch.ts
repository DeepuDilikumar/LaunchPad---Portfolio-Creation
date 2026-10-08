import "server-only";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export class UnsafeUrlError extends Error {}

/** True for loopback, private, link-local, CGNAT, multicast and other non-public ranges. */
export function isPrivateAddress(ip: string): boolean {
  if (isIP(ip) === 4) {
    const [a, b] = ip.split(".").map(Number) as [number, number, number, number];
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 192 && b === 0) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224
    );
  }
  const v6 = ip.toLowerCase();
  if (v6 === "::" || v6 === "::1") return true;
  const mapped = v6.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateAddress(mapped[1]!);
  return /^(fc|fd|fe8|fe9|fea|feb|ff)/.test(v6);
}

export async function assertPublicUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new UnsafeUrlError("That isn't a valid URL.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new UnsafeUrlError("Only http and https URLs can be checked.");
  if (url.username || url.password) throw new UnsafeUrlError("URLs with credentials aren't allowed.");
  if (url.port && !["80", "443"].includes(url.port)) throw new UnsafeUrlError("Only standard ports (80 and 443) can be checked.");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".internal") || host.endsWith(".local")) {
    throw new UnsafeUrlError("That host isn't publicly reachable.");
  }
  const addresses = isIP(host) ? [{ address: host }] : await lookup(host, { all: true }).catch(() => []);
  if (!addresses.length) throw new UnsafeUrlError("That host doesn't resolve.");
  if (addresses.some((a) => isPrivateAddress(a.address))) throw new UnsafeUrlError("That host points to a private network address.");
  return url;
}

/**
 * Fetch a learner-supplied URL safely: public addresses only, manual redirects (each hop
 * re-validated, max 3), 5s timeout, 1MB body cap.
 */
export async function safeFetchText(
  raw: string,
  opts: { allowOrigin?: string; timeoutMs?: number; maxBytes?: number } = {},
): Promise<{ status: number; body: string; finalUrl: string }> {
  const timeoutMs = opts.timeoutMs ?? 5000;
  const maxBytes = opts.maxBytes ?? 1_000_000;
  const signal = AbortSignal.timeout(timeoutMs);
  let current = raw;
  for (let hop = 0; hop < 4; hop++) {
    const url = opts.allowOrigin && new URL(current).origin === opts.allowOrigin ? new URL(current) : await assertPublicUrl(current);
    const res = await fetch(url, { redirect: "manual", signal, headers: { "user-agent": "BuildproofVerifier/1.0", accept: "text/html" } });
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      if (hop === 3) throw new UnsafeUrlError("Too many redirects.");
      current = new URL(res.headers.get("location")!, url).toString();
      continue;
    }
    const reader = res.body?.getReader();
    let received = 0;
    const chunks: Uint8Array[] = [];
    if (reader) {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        received += value.byteLength;
        if (received > maxBytes) {
          await reader.cancel();
          break;
        }
        chunks.push(value);
      }
    }
    return { status: res.status, body: Buffer.concat(chunks).toString("utf8"), finalUrl: url.toString() };
  }
  throw new UnsafeUrlError("Too many redirects.");
}
