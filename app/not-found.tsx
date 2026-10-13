import Link from "next/link";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto flex max-w-[720px] flex-col gap-5 px-4 py-24 sm:px-6">
        <span className="label">// 404</span>
        <h1 className="h-display m-0 text-5xl">That page went quiet.</h1>
        <Link href="/" className="keycap self-start">
          Back home
        </Link>
      </main>
      <SiteFooter />
    </>
  );
}
