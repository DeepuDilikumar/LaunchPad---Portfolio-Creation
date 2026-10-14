import { beforeEach, describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { createDownloadLink, maskEmail, parseFileId } from "@/lib/delivery";
import { sha256 } from "@/lib/ids";
import { stampLine, stampPdf, winAnsiSafe } from "@/lib/stamp";
import { samplePdf, setupWorld } from "./helpers";

describe("stamping", () => {
  it("writes the buyer's email and order id into every page", async () => {
    const out = await stampPdf(await samplePdf(4), { email: "a@b.in", orderId: "sq_123" });
    const doc = await PDFDocument.load(out);
    expect(doc.getPageCount()).toBe(4);
    expect(doc.getSubject()).toContain("a@b.in");
    expect(doc.getSubject()).toContain("sq_123");
    expect(Buffer.from(out).length).toBeGreaterThan(Buffer.from(await samplePdf(4)).length);
  });

  it("never throws on characters the standard font can't draw", () => {
    expect(winAnsiSafe("₹349 – “hi” ✓")).toBe('Rs 349 - "hi" ?');
    expect(stampLine({ email: "ü@x.in", orderId: "sq_1" })).toContain("?@x.in");
  });
});

describe("download links", () => {
  beforeEach(async () => {
    await setupWorld();
  });

  it("allow 5 downloads, then stop", async () => {
    const { getStore } = await import("@/lib/db");
    const token = await createDownloadLink("sq_x");
    const now = new Date().toISOString();
    for (let i = 0; i < 5; i++)
      expect(await getStore().consumeDownload(sha256(token), now)).not.toBeNull();
    expect(await getStore().consumeDownload(sha256(token), now)).toBeNull();
  });

  it("expire after 24 hours", async () => {
    const { getStore } = await import("@/lib/db");
    const token = await createDownloadLink("sq_y");
    const later = new Date(Date.now() + 24 * 3600_000 + 1000).toISOString();
    expect(await getStore().consumeDownload(sha256(token), later)).toBeNull();
  });

  it("parse file ids and mask emails", () => {
    expect(parseFileId("backend-a4")).toEqual({ guide: "backend", edition: "a4" });
    expect(parseFileId("system-design-phone")).toEqual({
      guide: "system-design",
      edition: "phone",
    });
    expect(parseFileId("../etc-a4")).toBeNull();
    expect(maskEmail("buyer@example.com")).toBe("bu•••@example.com");
  });
});
