import { expect, test } from "@playwright/test";
import { acceptEssentialCookies, completeOnboarding, mockSignIn } from "./helpers";

test("J8: a college asks for access, admin creates codes, students redeem within limits", async ({ browser, page, context, baseURL }) => {
  await acceptEssentialCookies(context, baseURL!);

  // The buyer fills in the contact form.
  await page.goto("/contact");
  await page.getByLabel("Your name").fill("Dr. Example");
  await page.getByLabel("Work email").fill("hod@college.example");
  await page.getByLabel("Company or college").fill("Example Institute of Technology");
  await page.getByLabel("This is for").selectOption("college");
  await page.getByLabel("Seats").fill("2");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.locator("[data-contact-sent]")).toBeVisible();

  // Admin creates a code with 2 redemptions that expires in a week.
  await mockSignIn(page, "admin");
  const expiresAt = new Date(Date.now() + 7 * 86_400_000).toISOString();
  const created = await page.request.post("/api/admin/coupons", { data: { kind: "grant", scope: "all", maxRedemptions: 2, expiresAt, prefix: "EIT", count: 1 } });
  expect(created.ok()).toBeTruthy();
  const { codes } = (await created.json()) as { codes: string[] };
  const code = codes[0]!;

  // And an expired one.
  const expired = await page.request.post("/api/admin/coupons", { data: { kind: "grant", scope: "all", maxRedemptions: 10, expiresAt: new Date(Date.now() - 60_000).toISOString(), prefix: "OLD" } });
  const oldCode = ((await expired.json()) as { codes: string[] }).codes[0]!;

  const student = async (n: number) => {
    const ctx = await browser.newContext();
    await acceptEssentialCookies(ctx, baseURL!);
    const p = await ctx.newPage();
    await mockSignIn(p, "email", { email: `student-${n}-${Date.now()}@college.example` });
    await completeOnboarding(p);
    return { ctx, p };
  };

  // Student 1 redeems through the pricing page UI.
  const s1 = await student(1);
  await s1.p.goto("/pricing");
  await s1.p.getByLabel("Access code").fill(code.toLowerCase());
  await s1.p.getByRole("button", { name: "Redeem" }).click();
  await expect(s1.p.getByText("All six projects are unlocked on your account.")).toBeVisible();
  await s1.p.goto("/learn/ledger/transfers-and-idempotency");
  await expect(s1.p.locator("[data-paywall]")).toHaveCount(0);
  // Redeeming twice doesn't use another seat.
  const twice = await s1.p.request.post("/api/coupons/redeem", { data: { code } });
  expect(twice.status()).toBe(400);

  const s2 = await student(2);
  expect((await s2.p.request.post("/api/coupons/redeem", { data: { code } })).ok()).toBeTruthy();

  // Seat limit reached.
  const s3 = await student(3);
  const full = await s3.p.request.post("/api/coupons/redeem", { data: { code } });
  expect(full.status()).toBe(400);
  expect(((await full.json()) as { error: string }).error).toMatch(/fully used/);
  // Expired code.
  const exp = await s3.p.request.post("/api/coupons/redeem", { data: { code: oldCode } });
  expect(((await exp.json()) as { error: string }).error).toMatch(/expired/);
  await s3.p.goto("/learn/ledger/transfers-and-idempotency");
  await expect(s3.p.locator("[data-paywall]")).toBeVisible();

  for (const s of [s1, s2, s3]) await s.ctx.close();
});
