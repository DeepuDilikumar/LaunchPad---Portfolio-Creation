import { beforeEach, describe, expect, it } from "vitest";
import { createCheckout } from "@/lib/orders";
import { fulfilOrder } from "@/lib/fulfil";
import { handleWebhookEvent } from "@/lib/webhook";
import { stampedKey } from "@/lib/storage";
import { setupWorld } from "./helpers";

type World = Awaited<ReturnType<typeof setupWorld>>;

function captured(rzpOrderId: string, amount: number, paymentId = "pay_test_1") {
  return {
    event: "payment.captured",
    created_at: 1_700_000_000,
    payload: {
      payment: {
        entity: {
          id: paymentId,
          order_id: rzpOrderId,
          amount,
          status: "captured",
          email: "Buyer@Example.com",
          contact: "+919999999999",
        },
      },
    },
  };
}

describe("payment webhook", () => {
  let w: World;
  beforeEach(async () => {
    w = await setupWorld();
  });

  it("fulfils a paid order: stamps both editions and sends one delivery email", async () => {
    const c = await createCheckout({ productSlug: "backend" });
    const res = await handleWebhookEvent(captured(c.razorpayOrderId, c.amountPaise), "evt_1");
    expect(await res.json()).toMatchObject({ ok: true, result: "fulfilled" });

    const order = await w.store.getOrder(c.orderId);
    expect(order?.status).toBe("fulfilled");
    expect(order?.email).toBe("buyer@example.com");
    expect(await w.storage.exists(stampedKey(c.orderId, "backend", "a4"))).toBe(true);
    expect(await w.storage.exists(stampedKey(c.orderId, "backend", "phone"))).toBe(true);
    expect(w.mailer.sent).toHaveLength(1);
    expect(w.mailer.sent[0].to).toBe("buyer@example.com");
  });

  it("sending the same webhook twice sends one email", async () => {
    const c = await createCheckout({ productSlug: "backend" });
    const ev = captured(c.razorpayOrderId, c.amountPaise);
    await handleWebhookEvent(ev, "evt_same");
    const second = await handleWebhookEvent(ev, "evt_same");
    expect(await second.json()).toMatchObject({ duplicate: true });
    expect(w.mailer.sent).toHaveLength(1);
  });

  it("payment.captured and order.paid for one payment deliver once", async () => {
    const c = await createCheckout({ productSlug: "backend" });
    await handleWebhookEvent(captured(c.razorpayOrderId, c.amountPaise), "evt_a");
    await handleWebhookEvent(
      { ...captured(c.razorpayOrderId, c.amountPaise), event: "order.paid" },
      "evt_b",
    );
    expect(w.mailer.sent).toHaveLength(1);
  });

  it("concurrent deliveries of different events still send one email", async () => {
    const c = await createCheckout({ productSlug: "backend" });
    await Promise.all([
      handleWebhookEvent(captured(c.razorpayOrderId, c.amountPaise), "evt_x"),
      handleWebhookEvent(
        { ...captured(c.razorpayOrderId, c.amountPaise), event: "order.paid" },
        "evt_y",
      ),
      fulfilOrder(c.orderId),
    ]);
    expect(w.mailer.sent).toHaveLength(1);
  });

  it("refuses a payment whose amount doesn't match the order", async () => {
    const c = await createCheckout({ productSlug: "backend" });
    const res = await handleWebhookEvent(captured(c.razorpayOrderId, 100), "evt_bad");
    expect(await res.json()).toMatchObject({ ok: false });
    expect((await w.store.getOrder(c.orderId))?.status).toBe("created");
    expect(w.mailer.sent.filter((m) => m.to === "buyer@example.com")).toHaveLength(0);
  });

  it("ignores payments for orders that aren't ours", async () => {
    const res = await handleWebhookEvent(captured("order_unknown", 49900), "evt_other");
    expect(await res.json()).toMatchObject({ ignored: "unknown order" });
  });

  it("retries 3 times, marks the order failed, then recovers on a later run", async () => {
    const c = await createCheckout({ productSlug: "backend" });
    await w.storage.put(
      "masters/backend/current-phone.pdf",
      new Uint8Array([1, 2, 3]),
      "application/pdf",
    );
    await handleWebhookEvent(captured(c.razorpayOrderId, c.amountPaise), "evt_fail");
    const failed = await w.store.getOrder(c.orderId);
    expect(failed?.status).toBe("failed");
    expect(failed?.attempts).toBe(3);
    expect(w.mailer.sent.filter((m) => m.to === "buyer@example.com")).toHaveLength(0);

    const { samplePdf } = await import("./helpers");
    await w.storage.put("masters/backend/current-phone.pdf", await samplePdf(), "application/pdf");
    expect(await fulfilOrder(c.orderId, { backoffMs: 1 })).toBe("fulfilled");
    expect(w.mailer.sent.filter((m) => m.to === "buyer@example.com")).toHaveLength(1);
  }, 20_000);
});
