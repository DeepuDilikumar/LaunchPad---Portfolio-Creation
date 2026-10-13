import { beforeEach, describe, expect, it } from "vitest";
import { currentPrice, getProduct, isLaunchActive, products, site } from "@/config/site";
import { createCheckout } from "@/lib/orders";
import { setupWorld } from "./helpers";

const backend = getProduct("backend")!;

describe("pricing rules", () => {
  it("charges the launch price only inside the real launch window", () => {
    const before = new Date(new Date(site.launch.startsAt).getTime() - 1000);
    const during = new Date(new Date(site.launch.startsAt).getTime() + 1000);
    const after = new Date(new Date(site.launch.endsAt).getTime() + 1000);
    expect(isLaunchActive(during)).toBe(true);
    expect(currentPrice(backend, before)).toBe(backend.price);
    expect(currentPrice(backend, during)).toBe(backend.launchPrice);
    expect(currentPrice(backend, after)).toBe(backend.price);
  });

  it("a launch window ends after it starts", () => {
    expect(new Date(site.launch.endsAt).getTime()).toBeGreaterThan(
      new Date(site.launch.startsAt).getTime(),
    );
  });

  it("a bigger bundle contains everything a smaller one has", () => {
    const sorted = [...products].sort((a, b) => a.price - b.price);
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        if (sorted[j].guides.length > 1 && sorted[j].price > sorted[i].price) {
          for (const g of sorted[i].guides) expect(sorted[j].guides).toContain(g);
        }
      }
    }
  });
});

describe("checkout", () => {
  beforeEach(async () => {
    await setupWorld();
  });

  it("charges what the page shows", async () => {
    const during = new Date(new Date(site.launch.startsAt).getTime() + 1000);
    const c = await createCheckout({ productSlug: "backend" }, during);
    expect(c.amountPaise).toBe(backend.launchPrice! * 100);
  });

  it("won't sell a product that isn't available", async () => {
    await expect(createCheckout({ productSlug: "switch-kit" })).rejects.toThrow(/isn't on sale/);
  });

  it("applies a friend's referral code, but not your own", async () => {
    const { getStore } = await import("@/lib/db");
    await getStore().createReferralCode({
      code: "DEEP-ABC123",
      order_id: "sq_ref",
      email: "friend@x.in",
      created_at: new Date().toISOString(),
    });
    const other = await createCheckout({
      productSlug: "backend",
      email: "new@x.in",
      referralCode: "deep-abc123",
    });
    expect(other.discount).toBe(site.referral.friendDiscount);
    const own = await createCheckout({
      productSlug: "backend",
      email: "friend@x.in",
      referralCode: "DEEP-ABC123",
    });
    expect(own.discount).toBe(0);
  });
});
