import { describe, expect, it } from "vitest";
import { assertPublicUrl, isPrivateAddress } from "@/lib/verify/safe-fetch";
import { allPassed, hasVerifyMeta, parseRepoUrl } from "@/lib/verify";
import { allowedNumbers, filterBullets, scrubCaseStudy } from "@/lib/ai/numbers";
import { templateDraft } from "@/lib/ai/generate";

describe("SSRF guard", () => {
  it("flags private, loopback, link-local and CGNAT addresses", () => {
    for (const ip of ["10.0.0.1", "127.0.0.1", "169.254.169.254", "172.16.5.4", "192.168.1.1", "100.64.0.1", "0.0.0.0", "::1", "fd00::1", "fe80::1", "::ffff:127.0.0.1"]) {
      expect(isPrivateAddress(ip), ip).toBe(true);
    }
    for (const ip of ["8.8.8.8", "1.1.1.1", "2606:4700:4700::1111"]) expect(isPrivateAddress(ip), ip).toBe(false);
  });
  it("rejects bad schemes, credentials, odd ports and internal hosts", async () => {
    await expect(assertPublicUrl("file:///etc/passwd")).rejects.toThrow(/http and https/);
    await expect(assertPublicUrl("http://user:pw@example.com")).rejects.toThrow(/credentials/);
    await expect(assertPublicUrl("http://example.com:8080")).rejects.toThrow(/ports/);
    await expect(assertPublicUrl("http://localhost/")).rejects.toThrow(/publicly reachable/);
    await expect(assertPublicUrl("http://169.254.169.254/latest/meta-data")).rejects.toThrow(/private/);
    await expect(assertPublicUrl("http://[::1]/")).rejects.toThrow(/private/);
  });
});

describe("verification helpers", () => {
  it("parses GitHub repo URLs only", () => {
    expect(parseRepoUrl("https://github.com/asha/pulse")).toEqual({ owner: "asha", repo: "pulse" });
    expect(parseRepoUrl("https://github.com/asha/pulse.git/")).toEqual({ owner: "asha", repo: "pulse" });
    expect(parseRepoUrl("https://gitlab.com/asha/pulse")).toBeNull();
    expect(parseRepoUrl("https://github.com/asha")).toBeNull();
  });
  it("finds the verification meta tag with the exact token", () => {
    expect(hasVerifyMeta('<head><meta name="buildproof-verify" content="bp_abc"></head>', "bp_abc")).toBe(true);
    expect(hasVerifyMeta("<meta content='bp_abc' name='buildproof-verify' />", "bp_abc")).toBe(true);
    expect(hasVerifyMeta('<meta name="buildproof-verify" content="bp_other">', "bp_abc")).toBe(false);
    expect(hasVerifyMeta("<p>bp_abc</p>", "bp_abc")).toBe(false);
  });
  it("the badge needs every check", () => {
    const ok = { ok: true, detail: "", at: "" };
    const all = { repo_public_owned: ok, commits: ok, workflows: ok, tests: ok, live_url: ok };
    expect(allPassed(all)).toBe(true);
    expect(allPassed({ ...all, tests: { ...ok, ok: false } })).toBe(false);
    expect(allPassed({ repo_public_owned: ok })).toBe(false);
    expect(allPassed(null)).toBe(false);
  });
});

describe("only numbers the learner entered", () => {
  const allowed = allowedNumbers(["p95 latency", "84 ms at 3,000 sockets"]);
  it("drops bullets with invented numbers", () => {
    expect(
      filterBullets(["Built Pulse, achieving p95 of 84 ms at 3000 sockets.", "Cut costs by 40%.", "Served 1M users.", "Wrote clear docs."], allowed),
    ).toEqual(["Built Pulse, achieving p95 of 84 ms at 3000 sockets.", "Wrote clear docs."]);
  });
  it("scrubs sentences with invented numbers from the case study", () => {
    const out = scrubCaseStudy("## Results\nLatency was 84 ms. Throughput rose 3x. It held up.", allowed);
    expect(out).toBe("## Results\nLatency was 84 ms. It held up.");
  });
  it("the mock template only uses inputs", () => {
    const d = templateDraft({ projectName: "Pulse", projectTitle: "Real-time messenger", stack: ["TypeScript", "Redis"], hardParts: ["Fan-out"], metrics: [], decisions: [] });
    expect(d.caseStudy).toMatch(/## Problem/);
    expect(d.bullets.join(" ")).not.toMatch(/\d/);
  });
});
