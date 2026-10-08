import "server-only";
import { lookup } from "node:dns/promises";
import { lookup as dnsLookup, type LookupAddress, type LookupOptions } from "node:dns";
import { BlockList, isIP } from "node:net";
import { Agent, fetch as undiciFetch } from "undici";

export class UnsafeUrlError extends Error {}

const v4Blocked = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 3],
] as const;
const v6Blocked = [
  ["::", 96], // unspecified, loopback and IPv4-compatible (::a.b.c.d)
  ["::ffff:0:0", 96], // IPv4-mapped, in any notation (::ffff:7f00:1 is 127.0.0.1)
  ["64:ff9b::", 96], // NAT64
  ["64:ff9b:1::", 48],
  ["100::", 64], // discard
  ["2001:db8::", 32], // documentation
  ["2002::", 16], // 6to4 can embed private IPv4
  ["fc00::", 7], // unique local
  ["fe80::", 10], // link-local
  ["ff00::", 8], // multicast
] as const;

// Separate lists: a single BlockList matches IPv4 addresses against IPv4-mapped IPv6 rules.
const blocked4 = new BlockList();
const blocked6 = new BlockList();
for (const [net, prefix] of v4Blocked) blocked4.addSubnet(net, prefix, "ipv4");
for (const [net, prefix] of v6Blocked) blocked6.addSubnet(net, prefix, "ipv6");

/** True for loopback, private, link-local, CGNAT, multicast, mapped/NAT64 and other non-public ranges. */
export function isPrivateAddress(ip: string): boolean {
  const family = isIP(ip);
  if (family === 4) return blocked4.check(ip, "ipv4");
  if (family === 6) return blocked6.check(ip, "ipv6");
  return true;
}

/** DNS lookup that refuses non-public addresses. Used at connect time, so rebinding can't slip through. */
function safeLookup(hostname: string, options: LookupOptions, callback: (err: NodeJS.ErrnoException | null, address: string | LookupAddress[], family?: number) => void) {
  dnsLookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) return callback(err, "");
    const list = (addresses as LookupAddress[]).filter((a) => !isPrivateAddress(a.address));
    if (!list.length) return callback(Object.assign(new Error("blocked address"), { code: "EBLOCKED" }), "");
    if (options.all) return callback(null, list);
    callback(null, list[0]!.address, list[0]!.family);
  });
}

const pinnedAgent = new Agent({ connect: { lookup: safeLookup as never }, headersTimeout: 5000, bodyTimeout: 5000 });

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
    const pinned = !(opts.allowOrigin && url.origin === opts.allowOrigin);
    const res = await undiciFetch(url, {
      redirect: "manual",
      signal,
      headers: { "user-agent": "BuildproofVerifier/1.0", accept: "text/html" },
      ...(pinned ? { dispatcher: pinnedAgent } : {}),
    });
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
