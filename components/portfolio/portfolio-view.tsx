import { ArrowUpRight, Award, GraduationCap, Mail, MapPin, Phone } from "lucide-react"
import type { ReactNode } from "react"

import { GitHubIcon } from "@/components/icons/brand"
import type { PortfolioContent, ProgramBadge, SectionKey, TemplateKey } from "@/lib/portfolio/types"
import { SKILL_GROUPS } from "@/lib/profile/types"
import { cn } from "@/lib/utils"

/**
 * The student's public portfolio. Three templates share the same sections and data, so
 * switching template never loses content. Server-renderable (no hooks), theme-aware.
 */

type Tone = {
  page: string
  hero: string
  heroText: string
  heroMuted: string
  name: string
  sectionTitle: (label: string) => ReactNode
  chip: string
  card: string
  link: string
}

const TONES: Record<TemplateKey, Tone> = {
  minimal: {
    page: "bg-background",
    hero: "bg-background",
    heroText: "text-foreground",
    heroMuted: "text-muted-foreground",
    name: "text-[2.25rem] leading-tight font-normal tracking-tight md:text-[3rem]",
    sectionTitle: (label) => <h2 className="text-caption font-medium tracking-[0.08em] text-muted-foreground uppercase">{label}</h2>,
    chip: "rounded-lg border border-border px-3 py-1 text-sm",
    card: "rounded-2xl border border-border p-5",
    link: "text-accent-text",
  },
  developer: {
    page: "bg-background",
    hero: "bg-surface border-b border-border",
    heroText: "text-foreground",
    heroMuted: "text-muted-foreground",
    name: "text-[2rem] leading-tight font-medium tracking-tight md:text-[2.75rem]",
    sectionTitle: (label) => (
      <h2 className="font-mono text-sm text-accent-text">
        <span aria-hidden>## </span>
        {label.toLowerCase()}
      </h2>
    ),
    chip: "rounded-md bg-muted px-2.5 py-1 font-mono text-[0.8125rem]",
    card: "rounded-xl border border-border bg-card p-5",
    link: "text-accent-text font-mono text-sm",
  },
  bold: {
    page: "bg-surface",
    hero: "bg-brand",
    heroText: "text-white",
    heroMuted: "text-white/85",
    name: "text-[2.5rem] leading-[1.05] font-medium tracking-tight md:text-[3.5rem]",
    sectionTitle: (label) => <h2 className="text-h2 font-medium">{label}</h2>,
    chip: "rounded-full bg-tonal px-3 py-1 text-sm text-tonal-foreground",
    card: "rounded-2xl bg-card p-5 shadow-e1",
    link: "text-accent-text",
  },
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("")
}

function ExternalLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  const safe = /^https?:\/\//i.test(href) ? href : `https://${href}`
  return (
    <a href={safe} target="_blank" rel="noopener noreferrer" className={cn("inline-flex items-center gap-1 hover:underline", className)}>
      {children}
      <ArrowUpRight className="size-3.5" aria-hidden />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  )
}

export function BuiltBadge({ badge, className }: { badge: ProgramBadge; className?: string }) {
  const pct = Math.round((badge.daysDone / badge.totalDays) * 100)
  return (
    <div className={cn("mt-4", className)}>
      <div className="flex items-center justify-between gap-2 text-caption">
        <span className="inline-flex items-center gap-1 rounded-full bg-tonal px-2.5 py-0.5 font-medium text-tonal-foreground">
          <Award className="size-3.5" aria-hidden />
          {badge.complete ? "Built in 14 days · Project complete" : "Building · 14-day program"}
        </span>
        <span className="tabular font-mono text-muted-foreground">
          Day {badge.daysDone} of {badge.totalDays}
        </span>
      </div>
      <div
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={badge.totalDays}
        aria-valuenow={badge.daysDone}
        aria-label="Project progress"
      >
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export function PortfolioView({
  content,
  badge,
  compact = false,
}: {
  content: PortfolioContent
  badge?: ProgramBadge | null
  /** Tighter spacing for in-app previews. */
  compact?: boolean
}) {
  const { profile } = content
  const tone = TONES[content.template]
  const visible = (key: SectionKey) => !content.hiddenSections.includes(key)
  const pad = compact ? "px-5" : "px-5 sm:px-8"
  const skillGroups = SKILL_GROUPS.filter((g) => profile.skills[g.key].length > 0)
  const projects = profile.projects.filter((p) => p.title.trim())
  const experience = profile.experience.filter((e) => e.role || e.company)

  const sections: Record<SectionKey, ReactNode> = {
    about: content.summary ? (
      <section key="about" className="flex flex-col gap-3">
        {tone.sectionTitle("About")}
        <p className="max-w-prose text-base leading-relaxed text-foreground">{content.summary}</p>
      </section>
    ) : null,
    skills: skillGroups.length ? (
      <section key="skills" className="flex flex-col gap-4">
        {tone.sectionTitle("Skills")}
        <div className="flex flex-col gap-3">
          {skillGroups.map((g) => (
            <div key={g.key} className="flex flex-col gap-2 sm:flex-row sm:items-baseline">
              <p className="w-44 shrink-0 text-sm text-muted-foreground">{g.label}</p>
              <ul className="flex flex-wrap gap-1.5">
                {profile.skills[g.key].map((s) => (
                  <li key={s} className={tone.chip}>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    ) : null,
    projects:
      projects.length || badge ? (
        <section key="projects" className="flex flex-col gap-4">
          {tone.sectionTitle("Projects")}
          <ul className="grid gap-4 md:grid-cols-2">
            {badge ? (
              <li className={cn(tone.card, "md:col-span-2")}>
                <h3 className="text-h3 font-medium">{badge.title}</h3>
                {badge.stack.length ? (
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {badge.stack.map((t) => (
                      <li key={t} className={tone.chip}>
                        {t}
                      </li>
                    ))}
                  </ul>
                ) : null}
                <BuiltBadge badge={badge} />
                {badge.repoUrl ? (
                  <ExternalLink href={badge.repoUrl} className={cn("mt-3", tone.link)}>
                    View code and commit history
                  </ExternalLink>
                ) : null}
              </li>
            ) : null}
            {projects.map((p) => (
              <li key={p.id} className={tone.card}>
                <h3 className="text-h3 font-medium">{p.title}</h3>
                {p.description ? <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.description}</p> : null}
                {p.tech.length ? (
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {p.tech.map((t) => (
                      <li key={t} className={tone.chip}>
                        {t}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {p.link ? (
                  <ExternalLink href={p.link} className={cn("mt-3", tone.link)}>
                    {/github\.com/i.test(p.link) ? "View code" : "View project"}
                  </ExternalLink>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null,
    experience: experience.length ? (
      <section key="experience" className="flex flex-col gap-4">
        {tone.sectionTitle("Experience")}
        <ol className="flex flex-col gap-5">
          {experience.map((e) => (
            <li key={e.id} className="border-l-2 border-border pl-4">
              <p className="font-medium">
                {e.role}
                {e.company ? <span className="text-muted-foreground"> · {e.company}</span> : null}
              </p>
              {e.period ? <p className="text-caption text-muted-foreground">{e.period}</p> : null}
              {e.bullets.filter(Boolean).length ? (
                <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-sm text-muted-foreground">
                  {e.bullets.filter(Boolean).map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ol>
      </section>
    ) : null,
    education:
      profile.college || profile.degree ? (
        <section key="education" className="flex flex-col gap-4">
          {tone.sectionTitle("Education")}
          <div className="flex gap-3">
            <GraduationCap className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
            <div>
              <p className="font-medium">{profile.college}</p>
              <p className="text-sm text-muted-foreground">
                {[profile.degree, profile.gradYear && `Class of ${profile.gradYear}`, profile.education[0]?.score].filter(Boolean).join(" · ")}
              </p>
            </div>
          </div>
        </section>
      ) : null,
    contact: (
      <section key="contact" className="flex flex-col gap-4">
        {tone.sectionTitle("Contact")}
        <ul className="flex flex-col gap-2 text-sm">
          {profile.email ? (
            <li className="flex items-center gap-2">
              <Mail className="size-4 text-muted-foreground" aria-hidden />
              <a href={`mailto:${profile.email}`} className={cn("hover:underline [overflow-wrap:anywhere]", tone.link)}>
                {profile.email}
              </a>
            </li>
          ) : null}
          {content.showPhone && profile.phone ? (
            <li className="flex items-center gap-2">
              <Phone className="size-4 text-muted-foreground" aria-hidden />
              <a href={`tel:${profile.phone.replace(/\s/g, "")}`} className={cn("hover:underline", tone.link)}>
                {profile.phone}
              </a>
            </li>
          ) : null}
          {profile.linkedinUrl ? (
            <li>
              <ExternalLink href={profile.linkedinUrl} className={tone.link}>
                LinkedIn
              </ExternalLink>
            </li>
          ) : null}
          {profile.githubUsername ? (
            <li>
              <ExternalLink href={`https://github.com/${profile.githubUsername}`} className={tone.link}>
                GitHub · {profile.githubUsername}
              </ExternalLink>
            </li>
          ) : null}
        </ul>
      </section>
    ),
  }

  return (
    <div className={cn("min-h-full", tone.page)}>
      <header className={cn(tone.hero, compact ? "py-8" : "py-12 md:py-20")}>
        <div className={cn("mx-auto max-w-4xl", pad)}>
          {content.template === "developer" ? (
            <p className="font-mono text-sm text-muted-foreground">~/{profile.githubUsername || initials(profile.fullName).toLowerCase() || "me"}</p>
          ) : content.template === "minimal" ? (
            <span
              className="mb-5 flex size-14 items-center justify-center rounded-full bg-tonal text-lg font-medium text-tonal-foreground"
              aria-hidden
            >
              {initials(profile.fullName) || "?"}
            </span>
          ) : null}
          <h1 className={cn(tone.name, tone.heroText, content.template === "developer" && "mt-1")}>
            {profile.fullName || "Your name"}
          </h1>
          <p className={cn("mt-2 text-lg", content.template === "developer" ? "font-mono text-accent-text" : tone.heroMuted)}>
            {content.template === "developer" ? `> ${content.headline}` : content.headline}
          </p>
          <div className={cn("mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm", tone.heroMuted)}>
            {profile.location ? (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4" aria-hidden />
                {profile.location}
              </span>
            ) : null}
            {profile.githubUsername ? (
              <a
                href={`https://github.com/${profile.githubUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 hover:underline"
              >
                <GitHubIcon className="size-4" />
                {profile.githubUsername}
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            ) : null}
            {profile.email ? (
              <a href={`mailto:${profile.email}`} className="inline-flex items-center gap-1.5 hover:underline">
                <Mail className="size-4" aria-hidden />
                Email me
              </a>
            ) : null}
          </div>
        </div>
      </header>

      <div className={cn("mx-auto flex max-w-4xl flex-col", pad, compact ? "gap-8 py-8" : "gap-12 py-12 md:gap-14 md:py-16")}>
        {content.sectionOrder.filter(visible).map((key) => sections[key])}
      </div>
    </div>
  )
}
