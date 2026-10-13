import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { Faq } from "@/components/product/Faq";
import { BusinessDetails } from "@/components/site/LegalPage";
import { allFaq } from "@/content/faq";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "FAQ",
  description: "Delivery, refunds, updates and who the guides are for.",
  path: "/faq",
  og: { title: "Frequently asked questions", kicker: "faq" },
});

export default function FaqPage() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <Faq items={allFaq} title="Frequently asked questions" />
        <div className="mx-auto max-w-[780px] px-4 pb-20 sm:px-6">
          <BusinessDetails />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
