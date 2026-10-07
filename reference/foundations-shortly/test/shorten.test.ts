import { describe, expect, it } from "vitest";
import { createStore } from "../src/store";

describe("link store", () => {
  it("creates a short code for a valid URL", () => {
    const store = createStore();
    const code = store.create("https://example.com/a/very/long/path");
    expect(code).toMatch(/^[a-zA-Z0-9]{6}$/);
    expect(store.resolve(code)).toBe("https://example.com/a/very/long/path");
  });

  it("rejects URLs that aren't http or https", () => {
    const store = createStore();
    expect(() => store.create("javascript:alert(1)")).toThrow("Only http and https URLs");
  });

  it("returns undefined for unknown codes", () => {
    expect(createStore().resolve("nope00")).toBeUndefined();
  });

  it("never returns the same code twice", () => {
    const store = createStore();
    const codes = new Set(Array.from({ length: 1000 }, (_, i) => store.create(`https://example.com/${i}`)));
    expect(codes.size).toBe(1000);
  });
});
