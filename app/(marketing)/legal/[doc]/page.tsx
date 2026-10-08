import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { legalDocs } from "@/content/legal";

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(legalDocs).map((doc) => ({ doc }));
}

export async function generateMetadata({ params }: { params: Promise<{ doc: string }> }): Promise<Metadata> {
  const { doc } = await params;
  const d = legalDocs[doc];
  return d ? { title: d.title, alternates: { canonical: `/legal/${doc}` } } : {};
}

export default async function LegalPage({ params }: { params: Promise<{ doc: string }> }) {
  const { doc } = await params;
  const d = legalDocs[doc];
  if (!d) notFound();
  return (
    <article className="container-bp max-w-[760px] pb-24 pt-32 md:pt-40">
      {/* Draft notice: remove once a lawyer has reviewed these terms. */}
      <p className="mb-8 rounded-[14px] border border-dashed border-line-strong px-4 py-3 t-small text-text-2" data-legal-draft>
        Draft. These terms haven&apos;t been reviewed by a lawyer yet and will change before launch.
      </p>
      <h1 className="t-h2 text-text-1">{d.title}</h1>
      <p className="mt-2 t-small text-text-3">Last updated {d.updated}</p>
      <div className="prose-bp t-body mt-10">
        {d.sections.map((s) => (
          <section key={s.heading}>
            <h2>{s.heading}</h2>
            {s.body.map((b) => (
              <p key={b}>{b}</p>
            ))}
          </section>
        ))}
      </div>
    </article>
  );
}
