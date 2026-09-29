import { describe, expect, it } from "vitest"

import { DEFAULT_AFTER_LOGIN, safeNextPath } from "@/lib/auth/redirect"

describe("safeNextPath", () => {
  it("allows same-site relative paths", () => {
    expect(safeNextPath("/start/publish")).toBe("/start/publish")
    expect(safeNextPath("/account?tab=data")).toBe("/account?tab=data")
  })

  it.each([
    null,
    undefined,
    "",
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "/foo\\bar",
    "javascript:alert(1)",
    "/ok\nSet-Cookie:x",
  ])("falls back for unsafe value %j", (value) => {
    expect(safeNextPath(value)).toBe(DEFAULT_AFTER_LOGIN)
  })
})
