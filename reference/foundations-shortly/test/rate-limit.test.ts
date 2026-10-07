import { describe, expect, it } from "vitest";
import { createRateLimiter } from "../src/rate-limit";

describe("token bucket rate limiter", () => {
  it("allows up to the limit within a window", () => {
    let now = 0;
    const rl = createRateLimiter({ limit: 3, windowMs: 60_000, now: () => now });
    expect([rl.take("a"), rl.take("a"), rl.take("a")]).toEqual([true, true, true]);
  });

  it("blocks the request after the limit", () => {
    let now = 0;
    const rl = createRateLimiter({ limit: 3, windowMs: 60_000, now: () => now });
    rl.take("a"); rl.take("a"); rl.take("a");
    expect(rl.take("a")).toBe(false);
  });

  it("refills over time", () => {
    let now = 0;
    const rl = createRateLimiter({ limit: 3, windowMs: 60_000, now: () => now });
    rl.take("a"); rl.take("a"); rl.take("a");
    now += 20_000; // one token per 20s
    expect(rl.take("a")).toBe(true);
    expect(rl.take("a")).toBe(false);
  });

  it("tracks keys independently", () => {
    let now = 0;
    const rl = createRateLimiter({ limit: 1, windowMs: 60_000, now: () => now });
    expect(rl.take("a")).toBe(true);
    expect(rl.take("b")).toBe(true);
    expect(rl.take("a")).toBe(false);
  });

  it("never refills above the limit", () => {
    let now = 0;
    const rl = createRateLimiter({ limit: 2, windowMs: 60_000, now: () => now });
    now += 10 * 60_000;
    expect([rl.take("a"), rl.take("a"), rl.take("a")]).toEqual([true, true, false]);
  });
});
