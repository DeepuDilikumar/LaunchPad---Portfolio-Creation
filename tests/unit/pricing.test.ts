import { describe, expect, it } from "vitest"

import { PLANS, bundleSavingsPaise, formatPrice, getPlan } from "@/config/pricing"

describe("pricing config", () => {
  it("matches the business model", () => {
    expect(getPlan("free").amountPaise).toBe(0)
    expect(getPlan("report").amountPaise).toBe(29900)
    expect(getPlan("program").amountPaise).toBe(79900)
    expect(getPlan("bundle").amountPaise).toBe(99900)
  })

  it("uses integer paise for every plan", () => {
    for (const plan of PLANS) expect(Number.isInteger(plan.amountPaise)).toBe(true)
  })

  it("bundle grants both entitlements and is cheaper than buying separately", () => {
    expect(getPlan("bundle").entitlements.sort()).toEqual(["program", "report"])
    expect(bundleSavingsPaise()).toBe(9900)
  })

  it("highlights at most one plan", () => {
    expect(PLANS.filter((p) => p.highlight).length).toBeLessThanOrEqual(1)
  })

  it("formats rupees without decimals for whole amounts", () => {
    expect(formatPrice(29900)).toBe("₹299")
    expect(formatPrice(0)).toBe("₹0")
    expect(formatPrice(99950)).toBe("₹999.50")
  })

  it("throws for unknown plans", () => {
    // @ts-expect-error — guarding runtime input
    expect(() => getPlan("gold")).toThrow()
  })
})
