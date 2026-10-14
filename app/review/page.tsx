import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { ReviewForm } from "@/components/order/ReviewForm";
import { verifyToken } from "@/lib/ids";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/config/site";

export const metadata = pageMetadata({
  title: "Leave a review",
  description: "Tell other engineers whether the guide helped.",
  path: "/review",
  noindex: true,
});

export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { t } = await searchParams;
  const valid = t ? verifyToken<{ o: string }>(t) : null;
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto flex max-w-[640px] flex-col gap-6 px-4 py-16 sm:px-6">
        <span className="label">// review</span>
        <h1 className="h-display m-0 text-[clamp(32px,5vw,46px)]">Did the guide help?</h1>
        <p className="text-body m-0">
          Honest is more useful than nice. Every review is from a verified order and is read before
          it’s published.
        </p>
        {valid && t ? (
          <ReviewForm token={t} />
        ) : (
          <p>
            This review link isn’t valid or has expired. Write to {site.support.email} for a new
            one.
          </p>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
