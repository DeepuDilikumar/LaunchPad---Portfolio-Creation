import { SAMPLE_PROFILES, TEMPLATE_LABELS } from "@/content/samples"
import { PhoneFrame, PortfolioPreview } from "./portfolio-preview"
import { Section } from "./section"

export function SamplePortfolios() {
  return (
    <Section
      id="samples"
      tone="surface"
      title="What your portfolio could look like"
      lead="Three templates. We pick the best one for you, and you can switch anytime without losing anything."
    >
      <ul className="grid gap-6 sm:grid-cols-3">
        {SAMPLE_PROFILES.map((profile) => (
          <li key={profile.slug}>
            <figure className="flex flex-col gap-3">
              <div
                aria-hidden
                className="mx-auto w-full max-w-[260px] rounded-2xl bg-card/50 p-3 sm:max-w-none"
              >
                <PhoneFrame url={`launchpad.app/p/${profile.slug.replace("sample-", "")}`}>
                  <PortfolioPreview profile={profile} template={profile.template} />
                </PhoneFrame>
              </div>
              <figcaption className="text-center sm:text-left">
                <p className="text-sm font-semibold">
                  {profile.name}
                  <span className="ml-2 rounded-full border border-border px-2 py-0.5 text-caption font-normal text-muted-foreground">
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
