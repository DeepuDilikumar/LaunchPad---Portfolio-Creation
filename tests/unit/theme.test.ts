import { describe, expect, it } from "vitest"

import { THEME_INIT_SCRIPT, THEME_STORAGE_KEY, isTheme, resolveTheme } from "@/lib/theme"

describe("theme", () => {
  it("uses the agreed storage key", () => {
    expect(THEME_STORAGE_KEY).toBe("launchpad_theme")
    expect(THEME_INIT_SCRIPT).toContain('"launchpad_theme"')
  })

  it("validates stored values", () => {
    expect(isTheme("light")).toBe(true)
    expect(isTheme("system")).toBe(true)
    expect(isTheme("blue")).toBe(false)
    expect(isTheme(null)).toBe(false)
  })

  it("resolves system against the OS preference", () => {
    expect(resolveTheme("system", true)).toBe("dark")
    expect(resolveTheme("system", false)).toBe("light")
    expect(resolveTheme("light", true)).toBe("light")
    expect(resolveTheme("dark", false)).toBe("dark")
  })

  it("init script never throws, even when storage is blocked", () => {
    const classes = new Set<string>()
    const root = {
      classList: { toggle: (c: string, on: boolean) => (on ? classes.add(c) : classes.delete(c)) },
      style: {} as Record<string, string>,
      dataset: {} as Record<string, string>,
    }
    const run = (getItem: () => string | null, prefersDark: boolean) =>
      new Function("localStorage", "window", "document", THEME_INIT_SCRIPT)(
        { getItem },
        { matchMedia: () => ({ matches: prefersDark }) },
        { documentElement: root }
      )

    run(() => "dark", false)
    expect(classes.has("dark")).toBe(true)
    expect(root.dataset.theme).toBe("dark")

    // Unknown or missing values fall back to light, even when the OS prefers dark.
    run(() => "garbage", true)
    expect(classes.has("dark")).toBe(false)
    expect(root.dataset.theme).toBe("light")

    run(() => null, true)
    expect(classes.has("dark")).toBe(false)

    run(() => "system", true)
    expect(classes.has("dark")).toBe(true)

    expect(() =>
      run(() => {
        throw new Error("SecurityError")
      }, true)
    ).not.toThrow()
  })
})
