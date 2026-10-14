import { getProduct, site } from "@/config/site";
import { SimpleEmail } from "@/emails/SimpleEmail";
import { getStore } from "./db";
import { createDownloadLink, downloadPageUrl } from "./delivery";
import { renderEmail } from "./email/render";
import { getMailer } from "./email/send";
import { getStorage, stampedKey } from "./storage";

/**
 * Emails every buyer of a guide, within the free-update window, a fresh link to the new version.
 * Their old stamped copies are re-stamped on the next fulfilment run, so we clear them first.
 */
export async function notifyBuyersOfUpdate(
  guide: string,
  version: string,
  notes: string,
): Promise<number> {
  const store = getStore();
  const since = new Date(Date.now() - site.delivery.updatesMonths * 30 * 86400_000).toISOString();
  const orders = (await store.listOrders(since, new Date().toISOString())).filter(
    (o) =>
      o.status === "fulfilled" && o.email && getProduct(o.product_slug)?.guides.includes(guide),
  );
  const storage = getStorage();
  const { stampPdf } = await import("./stamp");
  const { masterKey } = await import("./storage");
  let sent = 0;
  for (const order of orders) {
    for (const edition of ["a4", "phone"] as const) {
      const master = await storage.get(masterKey(guide, edition));
      if (!master) throw new Error(`master missing for ${guide} ${edition}`);
      await storage.put(
        stampedKey(order.id, guide, edition),
        await stampPdf(master, { email: order.email!, orderId: order.id }),
        "application/pdf",
      );
    }
    const token = await createDownloadLink(order.id);
    const { html, text } = await renderEmail(
      SimpleEmail({
        preview: `Version ${version} is out`,
        heading: `Free update: v${version}`,
        paragraphs: [
          notes,
          `Your updated copy is stamped and ready. The link works for ${site.delivery.linkHours} hours.`,
          `Full changelog: ${site.url}/changelog`,
        ],
        cta: { label: "Download the update", url: downloadPageUrl(token) },
      }),
    );
    await getMailer().send({
      to: order.email!,
      subject: `Free update: v${version}`,
      html,
      text,
      idempotencyKey: `update-${guide}-${version}-${order.id}`,
    });
    sent++;
  }
  return sent;
}
