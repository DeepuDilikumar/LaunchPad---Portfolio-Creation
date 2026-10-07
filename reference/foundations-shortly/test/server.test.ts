import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { AddressInfo } from "node:net";
import { createApp } from "../src/server";

const app = createApp({ limit: 3, windowMs: 60_000 });
let base = "";

beforeAll(async () => {
  await new Promise<void>((r) => app.listen(0, r));
  base = `http://127.0.0.1:${(app.address() as AddressInfo).port}`;
});
afterAll(() => new Promise<void>((r) => app.close(() => r())));

const shorten = (url: string) =>
  fetch(`${base}/shorten`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url }) });

describe("http api", () => {
  it("shortens and redirects", async () => {
    const res = await shorten("https://example.com/docs");
    expect(res.status).toBe(201);
    const { code } = (await res.json()) as { code: string };
    const hop = await fetch(`${base}/${code}`, { redirect: "manual" });
    expect(hop.status).toBe(301);
    expect(hop.headers.get("location")).toBe("https://example.com/docs");
  });

  it("returns 429 after the limit", async () => {
    await shorten("https://example.com/2");
    await shorten("https://example.com/3");
    const res = await shorten("https://example.com/4");
    expect(res.status).toBe(429);
    expect(res.headers.get("retry-after")).toBe("60");
  });
});
