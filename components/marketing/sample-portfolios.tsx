import { SAMPLE_PROFILES, TEMPLATE_LABELS } from "@/content/samples"
import { PhoneFrame, PortfolioPreview } from "./portfolio-preview"
import { Section } from "./section"

export function SamplePortfolios() {
  return (
    <Section
      id="samples"
      tone="surface"
      eyebrow="Samples"
      title="What your portfolio could look like"
      lead="Three templates. We pick the best one for you, and you can switch anytime without losing anything."
    >
      <ul className="grid gap-5 sm:grid-cols-3">
        {SAMPLE_PROFILES.map((profile) => (
          <li key={profile.slug}>
            <figure className="flex h-full flex-col gap-4 rounded-2xl bg-card p-4 shadow-e1">
              <div aria-hidden className="mx-auto w-full max-w-[260px] sm:max-w-none">
                <PhoneFrame url={`launchpad.app/p/${profile.slug.replace("sample-", "")}`}>
                  <PortfolioPreview profile={profile} template={profile.template} />
                </PhoneFrame>
              </div>
              <figcaption className="px-1">
                <p className="flex items-center gap-2 text-sm font-medium">
                  {profile.name}
                  <span className="rounded-full bg-muted px-2 py-0.5 text-caption font-normal text-muted-foreground">
                    Sample
                  </span>
                </p>
                <p className="mt-1 text-caption text-muted-foreground">
                  {profile.role} · {TEMPLATE_LABELS[profile.template]} template
                </p>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </Section>
  )
}
