import { site } from "@/config/site";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { OrderStatus } from "@/components/order/OrderStatus";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Thank you",
  description: "Your order and download link.",
  path: "/thank-you",
  noindex: true,
});

export default async function ThankYou({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto flex max-w-[720px] flex-col gap-6 px-4 py-16 sm:px-6">
        <span className="label">// thank you</span>
        <h1 className="h-display m-0 text-[clamp(34px,5vw,50px)]">
          You’re in. <span className="marker">Check your email.</span>
        </h1>
        {sp.order ? (
          <OrderStatus
            orderId={sp.order}
            expired={sp.link === "expired"}
            supportEmail={site.support.email}
          />
        ) : (
          <p className="text-lg">
            Your download link is in your email. Can’t find it? Write to {site.support.email}.
          </p>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
