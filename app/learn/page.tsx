import Link from "next/link";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { listArticles } from "@/lib/learn";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Learn: free follow-up questions",
  description:
    "Free backend interview questions with the follow-ups that come next and how to answer them.",
  path: "/learn",
  og: { title: "Free follow-up questions, with how to answer them", kicker: "learn" },
});

export default function LearnIndex() {
  const articles = listArticles();
  return (
    <>
      <SiteHeader active="learn" />
      <main id="main" className="mx-auto flex max-w-[900px] flex-col gap-8 px-4 py-16 sm:px-6">
        <div className="flex flex-col gap-3">
          <span className="label">// learn · free</span>
          <h1 className="h-display m-0 text-[clamp(36px,5vw,54px)]">
            One question. Three follow-ups. How to answer them.
          </h1>
        </div>
        <ul className="m-0 flex list-none flex-col gap-5 p-0">
          {articles.map((a) => (
            <li key={a.slug}>
              <Link
                href={`/learn/${a.slug}`}
                className="card-ink text-ink hover:text-ink flex flex-col gap-2 p-6 no-underline shadow-[4px_4px_0_var(--ink)]"
              >
                <span className="font-head text-2xl leading-tight font-bold">{a.title}</span>
                <span className="text-body">{a.description}</span>
                <span className="text-muted font-mono text-xs">updated {a.updated}</span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <SiteFooter />
    </>
  );
}
