import { beforeEach, describe, expect, it } from "vitest";
import { scheduleSequence, sendSequenceStep, SEQUENCE_DAYS } from "@/lib/sequence";
import { setupWorld } from "./helpers";

describe("readiness check email sequence", () => {
  let w: Awaited<ReturnType<typeof setupWorld>>;
  beforeEach(async () => {
    w = await setupWorld();
  });

  it("schedules 3 emails over 5 days, in order, once", async () => {
    const lead = await w.store.upsertLead({
      email: "l@x.in",
      source: "check",
      consent_marketing: true,
      segment: {},
      utm: {},
    });
    const t0 = new Date("2026-11-01T10:00:00Z");
    await scheduleSequence(lead.id, t0);
    await scheduleSequence(lead.id, t0);
    const due = await w.store.dueEmails("2026-12-01T00:00:00Z", 10);
    expect(due.map((d) => d.step)).toEqual([1, 2, 3]);
    expect(SEQUENCE_DAYS.at(-1)).toBe(5);
  });

  it("unsubscribe cancels what's left and stops sends", async () => {
    const lead = await w.store.upsertLead({
      email: "u@x.in",
      source: "check",
      consent_marketing: true,
      segment: {},
      utm: {},
    });
    await scheduleSequence(lead.id);
    await w.store.unsubscribeLead(lead.id);
    expect(await w.store.dueEmails("2099-01-01T00:00:00Z", 10)).toEqual([]);
    const fresh = (await w.store.getLead(lead.id))!;
    expect(
      await sendSequenceStep(
        {
          id: "e",
          lead_id: lead.id,
          sequence: "s",
          step: 1,
          send_at: "",
          sent_at: null,
          cancelled_at: null,
        },
        fresh,
      ),
    ).toBe(false);
  });

  it("sends each step with a one-click unsubscribe header", async () => {
    const lead = await w.store.upsertLead({
      email: "s@x.in",
      source: "check",
      consent_marketing: true,
      segment: {},
      utm: {},
    });
    for (const step of [1, 2, 3]) {
      await sendSequenceStep(
        {
          id: `e${step}`,
          lead_id: lead.id,
          sequence: "s",
          step,
          send_at: "",
          sent_at: null,
          cancelled_at: null,
        },
        lead,
      );
    }
    expect(w.mailer.sent).toHaveLength(3);
    for (const m of w.mailer.sent)
      expect(m.headers?.["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
  });
});
