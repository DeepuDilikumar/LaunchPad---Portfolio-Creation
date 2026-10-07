import { describe, expect, it } from "vitest";
import { extractCells, parseModule, teaserSource } from "@/lib/content/parse";

const mdx = `---
title: "Test"
slug: test
project: pulse
order: 3
minutes: 10
objectives: ["Do the thing"]
status: published
free: false
---

<Explain id="intro">
Public teaser.
</Explain>

<Prompt id="p1" claude="a" codex="b" />

<Checkpoint id="cp" cmd="pnpm test" pass="ok" required />

<Checkpoint id="opt" cmd="x" pass="y" />

<Decision id="d1" question="Why?" />

<Explain>
Secret paid content.
</Explain>
`;

describe("content parsing", () => {
  it("extracts cells with stable ids and requirements", () => {
    const m = parseModule(mdx);
    expect(m.cells.map((c) => c.id)).toEqual(["intro", "p1", "cp", "opt", "d1", "explain-5"]);
    expect(m.cells.filter((c) => c.required).map((c) => c.id)).toEqual(["cp", "d1"]);
  });
  it("teaser contains only the first Explain cell", () => {
    const m = parseModule(mdx);
    const t = teaserSource(m.body, m.cells);
    expect(t).toContain("Public teaser.");
    expect(t).not.toContain("Secret paid content.");
    expect(t).not.toContain("Checkpoint");
  });
  it("rejects duplicate ids", () => {
    expect(() => parseModule(mdx.replace('id="opt"', 'id="cp"'))).toThrow(/duplicate cell id/);
  });
  it("rejects bad frontmatter", () => {
    expect(() => parseModule(mdx.replace("project: pulse", "project: nope"))).toThrow(/invalid frontmatter/);
  });
  it("works without frontmatter for cell extraction", () => {
    expect(extractCells('<Quiz id="q" options={["a"]} answer={0} why="w" />')[0]?.kind).toBe("Quiz");
  });
});
