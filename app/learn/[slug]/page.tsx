import Link from "next/link";
import { notFound } from "next/navigation";
import { site } from "@/config/site";
import { JsonLd } from "@/components/site/JsonLd";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { guideFacts, productOnSale } from "@/lib/catalog";
import { getArticle, listArticles } from "@/lib/learn";
import { absoluteUrl, ogImageUrl, pageMetadata } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return listArticles().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const a = getArticle((await params).slug);
  if (!a) return {};
  return {
    ...pageMetadata({
      title: a.title,
      description: a.description,
      path: `/learn/${a.slug}`,
      type: "article",
      og: { title: a.primary, kicker: "learn · interview follow-ups" },
    }),
    keywords: a.keywords,
  };
}

const tagLabel: Record<string, string> = { measurement: "measure" };

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const a = getArticle((await params).slug);
  if (!a) notFound();
  const facts = guideFacts(a.guide);
  const onSale = productOnSale(a.guide);
  return (
    <>
      <SiteHeader active="learn" />
      <main id="main" className="mx-auto flex max-w-[760px] flex-col gap-8 px-4 py-14 sm:px-6">
        <article className="flex flex-col gap-6">
          <span className="label">
            <Link href="/learn" className="text-muted no-underline">
              learn
            </Link>{" "}
            / updated {a.updated}
          </span>
          <h1 className="h-display m-0 text-[clamp(32px,4.6vw,48px)]">{a.title}</h1>
          <p className="text-body m-0 text-lg leading-relaxed">{a.description}</p>

          <div className="card-ink flex flex-col gap-4 p-6">
            <span className="text-blue font-mono text-[13px]">interviewer &gt;</span>
            <p className="font-head m-0 text-[clamp(22px,3vw,28px)] leading-tight font-bold">
              {a.primary}
            </p>
            <span className="text-muted font-mono text-[11px] font-semibold">
              THE FOLLOW-UPS THAT COME NEXT
            </span>
            <ol className="m-0 flex list-none flex-col gap-3 p-0">
              {a.follow_ups.map((f) => (
                <li key={f.question} className="flex flex-col gap-1">
                  <span className="flex items-baseline gap-2.5">
                    <span className={`tag tag-${f.type}`}>{tagLabel[f.type] ?? f.type}</span>
                    <span className="font-semibold">{f.question}</span>
                  </span>
                  <span className="text-muted text-[15px]">Tests: {f.what_it_tests}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="prose-article" dangerouslySetInnerHTML={{ __html: a.html }} />

          <div className="border-green bg-green-wash flex flex-col gap-2.5 rounded-[10px] border-[1.5px] p-5">
            <span className="text-green-dark font-mono text-[11px] font-semibold">
              STRONG ANSWER OUTLINE
            </span>
            {a.outline.map((o, i) => (
              <div key={o} className="flex items-baseline gap-2.5">
                <span className="font-head text-green-dark font-extrabold">{i + 1}</span>
                <span>{o}</span>
              </div>
            ))}
          </div>
        </article>

        <aside className="bg-ink text-paper flex flex-col gap-3 rounded-2xl p-6">
          <span className="text-marker font-mono text-[11px] font-semibold">
            WANT MORE OF THESE?
          </span>
          <span className="font-head text-card text-2xl leading-tight font-bold">
            {facts.questions > 0
              ? `The Backend Switch Guide has ${facts.questions} questions like this, each with ${facts.followUpRange} follow-ups and a strong answer.`
              : "The Backend Switch Guide is built entirely around questions like this one."}
          </span>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/guides/${a.guide}?utm_source=learn&utm_content=${a.slug}`}
              className="bg-marker text-ink hover:text-ink inline-flex min-h-[50px] items-center rounded-xl px-5 font-bold no-underline"
            >
              {onSale ? "See the guide" : "Preview the guide"}
            </Link>
            <Link
              href="/check"
              className="border-card text-card hover:text-card inline-flex min-h-[50px] items-center rounded-xl border-[1.5px] px-5 font-semibold no-underline"
            >
              Take the free 2-min check
            </Link>
          </div>
        </aside>
      </main>
      <SiteFooter />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: a.title,
          description: a.description,
          datePublished: a.published,
          dateModified: a.updated,
          author: site.author.named
            ? { "@type": "Person", name: site.author.name, url: absoluteUrl("/about") }
            : { "@type": "Organization", name: site.name },
          publisher: { "@type": "Organization", name: site.name, url: site.url },
          image: absoluteUrl(
            ogImageUrl({ title: a.primary, kicker: "learn · interview follow-ups" }),
          ),
          mainEntityOfPage: absoluteUrl(`/learn/${a.slug}`),
          keywords: a.keywords.join(", "),
        }}
      />
    </>
  );
}
