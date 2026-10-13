import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Unsubscribe",
  description: "Stop marketing emails.",
  path: "/unsubscribe",
  noindex: true,
});

export default async function Unsubscribe({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto flex max-w-[640px] flex-col gap-6 px-4 py-20 sm:px-6">
        {sp.done ? (
          <>
            <h1 className="h-display m-0 text-[40px]">You’re unsubscribed.</h1>
            <p className="text-body m-0">
              No more emails from the Readiness Check sequence. Order and download emails still
              reach you if you buy.
            </p>
          </>
        ) : sp.error || !sp.t ? (
          <>
            <h1 className="h-display m-0 text-[40px]">That link didn’t work.</h1>
            <p className="text-body m-0">
              Reply to any of our emails with “unsubscribe” and we’ll remove you by hand.
            </p>
          </>
        ) : (
          <form method="post" action="/api/unsubscribe" className="flex flex-col gap-4">
            <h1 className="h-display m-0 text-[40px]">Unsubscribe?</h1>
            <p className="text-body m-0">
              You’ll stop getting the short follow-up emails. One click, no questions.
            </p>
            <input type="hidden" name="t" value={sp.t} />
            <button type="submit" className="keycap self-start">
              Unsubscribe me
            </button>
          </form>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
