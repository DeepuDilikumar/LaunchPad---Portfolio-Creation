import { describe, expect, it } from "vitest";
import { formatPrice, products, plans } from "@/config/pricing";
import { cn } from "@/lib/cn";

describe("pricing config", () => {
  it("formats INR and USD", () => {
    expect(formatPrice(products["pro-project"].price.INR, "INR")).toBe("₹1,499");
    expect(formatPrice(products["pro-all"].price.USD, "USD")).toBe("$59");
  });
  it("every plan product exists", () => {
    for (const p of plans) for (const slug of p.products) expect(products[slug]).toBeDefined();
  });
});

describe("cn", () => {
  it("joins truthy values", () => {
    expect(cn("a", false, ["b", null, ["c"]], undefined)).toBe("a b c");
  });
});
