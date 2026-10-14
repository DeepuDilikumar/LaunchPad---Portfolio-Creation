import { JsonLd } from "@/components/site/JsonLd";

export interface FaqItem {
  q: string;
  a: string;
}

/** FAQ with FAQPage JSON-LD. */
export function Faq({ items, title = "Questions" }: { items: FaqItem[]; title?: string }) {
  return (
    <section className="mx-auto flex max-w-[780px] flex-col gap-1 px-4 py-20 sm:px-6">
      <h2 className="font-head m-0 mb-3.5 text-4xl font-extrabold tracking-tight">{title}</h2>
      {items.map((f, i) => (
        <details
          key={f.q}
          className={`border-ink border-t-[1.5px] py-4 ${i === items.length - 1 ? "border-b-[1.5px]" : ""}`}
        >
          <summary className="min-h-7 cursor-pointer text-[17px] font-semibold">{f.q}</summary>
          <p className="text-body mt-2.5 mb-0 leading-relaxed">{f.a}</p>
        </details>
      ))}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: items.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }}
      />
    </section>
  );
}
