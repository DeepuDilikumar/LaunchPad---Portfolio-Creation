import Link from "next/link";
import { getProduct, site } from "@/config/site";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { getStore } from "@/lib/db";
import { deliverableGuides, fileId, guideTitle } from "@/lib/delivery";
import { sha256 } from "@/lib/ids";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata({
  title: "Download",
  description: "Download your guide.",
  path: "/download",
  noindex: true,
});

/**
 * The email links here, not straight to the file: opening this page doesn't count as a download,
 * so mail scanners that prefetch links can't use up the buyer's 5 downloads.
 */
export default async function DownloadPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const store = getStore();
  const link = sp.t ? await store.getDownloadLink(sha256(sp.t)) : null;
  const order = link ? await store.getOrder(link.order_id) : null;
  const valid =
    link &&
    order &&
    link.expires_at > new Date().toISOString() &&
    link.downloads < link.max_downloads;

  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto flex max-w-[720px] flex-col gap-6 px-4 py-16 sm:px-6">
        <span className="label">// download</span>
        {valid && order ? (
          <>
            <h1 className="h-display m-0 text-[clamp(32px,5vw,46px)]">
              {getProduct(order.product_slug)?.name}
            </h1>
            <p className="text-body m-0">
              Stamped for {order.email}. {link.max_downloads - link.downloads} downloads left on
              this link, until{" "}
              {new Date(link.expires_at).toLocaleString("en-IN", {
                dateStyle: "medium",
                timeStyle: "short",
                timeZone: "Asia/Kolkata",
              })}{" "}
              IST.
            </p>
            <div className="flex flex-col gap-4">
              {deliverableGuides(order.product_slug).map((g) => (
                <div key={g} className="card-ink flex flex-col gap-3 p-5">
                  <span className="font-head text-xl font-bold">{guideTitle(g)}</span>
                  <div className="flex flex-wrap gap-3">
                    <a
                      className="keycap !min-h-12 !text-base"
                      href={`/api/download?t=${encodeURIComponent(sp.t!)}&file=${fileId(g, "a4")}`}
                    >
                      A4 edition (laptop)
                    </a>
                    <a
                      className="keycap-ghost !min-h-12"
                      href={`/api/download?t=${encodeURIComponent(sp.t!)}&file=${fileId(g, "phone")}`}
                    >
                      Phone edition
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <h1 className="h-display m-0 text-[clamp(32px,5vw,46px)]">This link has expired.</h1>
            <p className="text-body m-0 text-lg">
              Links last {site.delivery.linkHours} hours and {site.delivery.maxDownloads} downloads.{" "}
              {order ? (
                <Link href={`/thank-you?order=${order.id}&link=expired`}>Get a fresh one here</Link>
              ) : (
                <>Reply to your delivery email or write to {site.support.email} for a fresh one.</>
              )}
            </p>
          </>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
