import { expect, test } from "@playwright/test";
import { acceptEssentialCookies, completeOnboarding, mockSignIn } from "./helpers";

const pulse = {
  "spec-and-system-design": { checkpoints: ["design-docs"], decisions: ["decision-architecture", "decision-transport"] },
  "repo-and-agent-setup": { checkpoints: ["workspace-green", "ci-green"], decisions: ["decision-repo"] },
  "data-model": { checkpoints: ["constraints-tested"], decisions: ["decision-receipts", "decision-gaps"] },
};

test("J6: a finisher verifies, generates and publishes a proof page; the badge only appears when every check passes", async ({ page, context, baseURL }) => {
  test.setTimeout(120_000);
  await acceptEssentialCookies(context, baseURL!);
  const stamp = Date.now();
  await mockSignIn(page, "email", { email: `finisher-${stamp}@example.test` });
  await completeOnboarding(page);
  const gh = `finisher${stamp}`;
  const settings = await page.request.post("/api/settings", {
    data: { name: "Fin Isher", handle: `fin-${stamp}`, headline: "Backend engineer", githubUsername: gh, preferredTool: "claude", isPublic: true, marketingEmails: true },
  });
  expect(settings.ok()).toBeTruthy();

  // Before finishing, the builder is locked.
  await page.goto("/proof/pulse");
  await expect(page.getByText("The proof pack builder unlocks when every published module")).toBeVisible();

  // Finish Pulse's published modules (checkpoints + decisions).
  for (const [module, req] of Object.entries(pulse)) {
    for (const cellId of req.checkpoints) {
      expect((await page.request.post("/api/progress", { data: { project: "pulse", module, cellId, kind: "checkpoint", status: "passed" } })).ok()).toBeTruthy();
    }
    for (const cellId of req.decisions) {
      const text = `In ${module} the agent proposed one approach; I changed it because it would not hold under concurrent writes.`;
      expect((await page.request.post("/api/decisions", { data: { project: "pulse", module, cellId, text, isPublic: cellId === "decision-receipts" } })).ok()).toBeTruthy();
    }
  }

  await page.goto("/dashboard");
  await page.locator('[data-proof-link="pulse"]').click();
  await expect(page).toHaveURL(/\/proof\/pulse$/);

  // A repo that fails checks: no badge.
  await page.getByLabel("GitHub repo").fill(`https://github.com/${gh}/pulse`);
  await page.getByRole("button", { name: "a mock deployment URL" }).click();
  await page.locator('[data-action="verify"]').click();
  await expect(page.locator('[data-check="commits"]')).toHaveAttribute("data-ok", "false");
  await expect(page.locator('[data-check="live_url"]')).toHaveAttribute("data-ok", "true");
  await expect(page.locator("[data-verified-badge]")).toHaveCount(0);

  // The repo that passes: every check green, badge appears.
  await page.getByLabel("GitHub repo").fill(`https://github.com/${gh}/pulse-verify-pass`);
  await page.locator('[data-action="verify"]').click();
  for (const id of ["repo_public_owned", "commits", "workflows", "tests", "live_url"]) {
    await expect(page.locator(`[data-check="${id}"]`)).toHaveAttribute("data-ok", "true");
  }
  await expect(page.locator("[data-verified-badge]")).toBeVisible();

  // Metrics (no defaults), featured decision, generate.
  await page.locator('[data-action="add-metric"]').click();
  await page.getByLabel("Metric 1 name", { exact: true }).fill("p95 latency");
  await page.getByLabel("Metric 1 value", { exact: true }).fill("84 ms at 3,000 sockets");
  await page.getByRole("checkbox").filter({ hasText: "" }).first().check();
  await page.locator('[data-action="generate"]').click();
  await expect(page.getByLabel("Case study (markdown: ## headings, paragraphs, - lists)")).toHaveValue(/## Problem/);
  const bullet = page.getByLabel("Bullet 1", { exact: true });
  await expect(bullet).toHaveValue(/Pulse/);
  // Every number in the bullets came from the learner's input.
  const bulletText = await bullet.inputValue();
  for (const n of bulletText.match(/\d+(?:,\d{3})*/g) ?? []) expect(["84", "95", "3,000", "3000"]).toContain(n);

  await page.locator('[data-action="publish"]').click();
  await expect(page.getByText("Published", { exact: true })).toBeVisible();
  await page.locator("[data-public-link]").click();
  await expect(page).toHaveURL(new RegExp(`/u/fin-${stamp}/pulse$`));
  await expect(page.locator("[data-verified-badge]")).toBeVisible();
  await expect(page.getByText("84 ms at 3,000 sockets", { exact: true })).toBeVisible();

  // Re-running verification after the repo stops passing removes the badge.
  await page.goto("/proof/pulse");
  await page.getByLabel("GitHub repo").fill(`https://github.com/someone-else/pulse-verify-pass`);
  await page.locator('[data-action="verify"]').click();
  await expect(page.locator('[data-check="repo_public_owned"]')).toHaveAttribute("data-ok", "false");
  await page.goto(`/u/fin-${stamp}/pulse`);
  await expect(page.locator("[data-verified-badge]")).toHaveCount(0);

  // OG image for sharing.
  const og = await page.locator('meta[property="og:image"]').getAttribute("content");
  const img = await page.request.get(og!);
  expect(img.headers()["content-type"]).toContain("image/png");
});
