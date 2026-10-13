import Link from "next/link";
import { site } from "@/config/site";
import { AuthorCard } from "@/components/site/AuthorCard";
import { JsonLd } from "@/components/site/JsonLd";
import { BusinessDetails } from "@/components/site/LegalPage";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { absoluteUrl, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: site.author.named ? `About ${site.author.name}` : `About ${site.name}`,
  description:
    "Who writes the guides, why they exist, and how every question is checked before it ships.",
  path: "/about",
  og: {
    title: site.author.named ? `Written by ${site.author.name}` : `About ${site.name}`,
    kicker: "about",
  },
});

export default function AboutPage() {
  return (
    <>
      <SiteHeader active="about" />
      <main id="main" className="mx-auto flex max-w-[760px] flex-col gap-10 px-4 py-16 sm:px-6">
        <div className="flex flex-col gap-3">
          <span className="label">// about</span>
          <h1 className="h-display m-0 text-[clamp(36px,5vw,52px)]">
            Why this <span className="marker">exists</span>.
          </h1>
        </div>
        <AuthorCard />
        <div className="prose-legal">
          <h2>How every question is made</h2>
          <ul>
            <li>
              Questions start from real interview loops and public write-ups. Every source is
              logged; nothing leaked or internal is ever used.
            </li>
            <li>
              Each question gets the follow-ups that usually come next, what they test, a weak
              answer and why it fails, and a strong answer.
            </li>
            <li>
              {site.author.named ? site.author.name : "The author"} reviews every page before it
              ships. Unreviewed drafts never reach the PDF.
            </li>
            <li>
              The numbers on this site (questions, follow-ups, pages) come from the build, not from
              copywriting.
            </li>
          </ul>
          <h2>What this isn’t</h2>
          <p>
            It isn’t a promise of a job, an offer or a salary, and it isn’t a list of “questions
            asked at company X”. It’s practice for the second question.
          </p>
        </div>
        <BusinessDetails />
        <Link href="/check" className="keycap self-start">
          Take the free 2-min check
        </Link>
      </main>
      <SiteFooter />
      {site.author.named ? (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Person",
            name: site.author.name,
            jobTitle: site.author.role,
            url: absoluteUrl("/about"),
          }}
        />
      ) : null}
    </>
  );
}
