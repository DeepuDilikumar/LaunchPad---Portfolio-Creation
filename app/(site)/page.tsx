import { Faq } from "@/components/marketing/faq"
import { FinalCta } from "@/components/marketing/final-cta"
import { Hero } from "@/components/marketing/hero"
import { HowItWorks } from "@/components/marketing/how-it-works"
import { Pricing } from "@/components/marketing/pricing"
import { SamplePortfolios } from "@/components/marketing/sample-portfolios"
import { StickyCta } from "@/components/marketing/sticky-cta"
import { FAQ } from "@/content/faq"

/** Feature A — landing page. Fully static: no auth or data calls. */
export default function HomePage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  }

  return (
    <>
      <Hero />
      <HowItWorks />
      <SamplePortfolios />
      <Pricing />
      <Faq />
      <FinalCta />
      <StickyCta />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c") }}
      />
    </>
  )
}
