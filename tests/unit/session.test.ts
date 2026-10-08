import { describe, expect, it } from "vitest";
import { makeSessionToken, readSessionToken } from "@/lib/auth/session";
import { safeReturnTo } from "@/lib/http";

const id = "00000000-0000-4000-8000-000000000001";

describe("mock session tokens", () => {
  it("round-trips a user id", () => {
    expect(readSessionToken(makeSessionToken(id))).toBe(id);
  });
  it("rejects tampered tokens", () => {
    const t = makeSessionToken(id);
    const other = "00000000-0000-4000-8000-0000000000ad";
    expect(readSessionToken(t.replace(id, other))).toBeNull();
    expect(readSessionToken(t.slice(0, -2) + "xx")).toBeNull();
    expect(readSessionToken("garbage")).toBeNull();
    expect(readSessionToken(undefined)).toBeNull();
  });
});

describe("safeReturnTo", () => {
  it("only allows same-origin paths", () => {
    expect(safeReturnTo("/learn/pulse/data-model#cell-x")).toBe("/learn/pulse/data-model#cell-x");
    expect(safeReturnTo("https://evil.example")).toBe("/dashboard");
    expect(safeReturnTo("//evil.example")).toBe("/dashboard");
    expect(safeReturnTo("/\\evil.example")).toBe("/dashboard");
    expect(safeReturnTo(null, "/x")).toBe("/x");
  });
});

describe("safeReturnTo bypasses", () => {
  it("rejects control characters and backslashes that browsers normalise into //", () => {
    for (const v of ["/\t/evil.com", "/\n/evil.com", "/%09/evil.com".replace("%09", "\t"), "/\\/evil.com", "/\r//evil.com"]) expect(safeReturnTo(v)).toBe("/dashboard");
  });
  it("keeps query and hash", () => {
    expect(safeReturnTo("/checkout?product=pro-all&currency=INR#x")).toBe("/checkout?product=pro-all&currency=INR#x");
  });
});
