"use client"

import { ChevronDown, Plus, Trash2 } from "lucide-react"
import type { ReactNode } from "react"

import { ChipInput } from "@/components/ui/chip-input"
import { Field, TextArea, TextInput } from "@/components/ui/field"
import { toast } from "@/components/ui/toaster"
import {
  SKILL_GROUPS,
  TARGET_ROLES,
  newId,
  type ExperienceEntry,
  type FieldSources,
  type Profile,
  type ProfileField,
  type ProjectEntry,
  type Skills,
  type TargetRole,
} from "@/lib/profile/types"
import { cn } from "@/lib/utils"

export type ProfileErrors = Partial<Record<"fullName" | "email" | "gradYear" | "linkedinUrl", string>>

export function validateProfile(profile: Profile): ProfileErrors {
  const errors: ProfileErrors = {}
  if (!profile.fullName.trim()) errors.fullName = "Add your name so people know whose portfolio this is."
  if (!profile.email.trim()) errors.email = "Add an email so recruiters can reach you."
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(profile.email.trim())) errors.email = "That email doesn't look right. Check for typos."
  if (profile.gradYear && !/^(19|20)\d{2}$/.test(profile.gradYear.trim())) errors.gradYear = "Use a 4-digit year, like 2026."
  if (profile.linkedinUrl && !/linkedin\.com\//i.test(profile.linkedinUrl)) errors.linkedinUrl = "Paste your LinkedIn profile link (linkedin.com/in/…)."
  return errors
}

const SKILL_SUGGESTIONS: Record<TargetRole, Partial<Record<keyof Skills, string[]>>> = {
  backend: { languages: ["Java", "Python", "Go"], frameworks: ["Spring Boot", "Node.js", "Express"], databases: ["PostgreSQL", "MySQL", "Redis"], tools: ["Git", "Docker", "Postman"] },
  frontend: { languages: ["JavaScript", "TypeScript"], frameworks: ["React", "Next.js", "Tailwind CSS"], databases: ["Firebase"], tools: ["Git", "Figma", "Vercel"] },
  fullstack: { languages: ["JavaScript", "TypeScript", "Java"], frameworks: ["React", "Node.js", "Express"], databases: ["PostgreSQL", "MongoDB", "Redis"], tools: ["Git", "Docker", "AWS"] },
  mobile: { languages: ["Kotlin", "Dart", "Swift"], frameworks: ["Flutter", "React Native", "Jetpack Compose"], databases: ["SQLite", "Firebase"], tools: ["Git", "Android Studio"] },
  data: { languages: ["Python", "SQL"], frameworks: ["Pandas", "scikit-learn", "PyTorch"], databases: ["PostgreSQL", "pgvector"], tools: ["Git", "Jupyter", "Docker"] },
  devops: { languages: ["Python", "Bash", "Go"], frameworks: [], databases: ["PostgreSQL", "Redis"], tools: ["Docker", "Kubernetes", "AWS", "Terraform", "GitHub Actions"] },
}

function FormSection({
  title,
  summary,
  defaultOpen,
  children,
}: {
  title: string
  summary?: string
  defaultOpen?: boolean
  children: ReactNode
}) {
  return (
    <details open={defaultOpen} className="group rounded-2xl border border-border bg-card">
      <summary className="flex min-h-14 list-none items-center justify-between gap-3 px-4 py-3 md:px-5 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          <span className="block text-base font-medium">{title}</span>
          {summary ? <span className="block truncate text-caption text-muted-foreground group-open:hidden">{summary}</span> : null}
        </span>
        <ChevronDown className="size-5 shrink-0 text-muted-foreground transition-transform duration-(--dur-base) group-open:rotate-180" aria-hidden />
      </summary>
      <div className="flex flex-col gap-5 border-t border-border px-4 pt-4 pb-5 md:px-5">{children}</div>
    </details>
  )
}

function removeWithUndo<T>(list: T[], index: number, apply: (next: T[]) => void, label: string) {
  const removed = list[index]
  apply(list.filter((_, i) => i !== index))
  toast(`${label} removed`, {
    action: { label: "Undo", onClick: () => apply([...list.slice(0, index), removed, ...list.slice(index)]) },
    duration: 6000,
  })
}

export function ProfileForm({
  profile,
  sources,
  errors,
  onChange,
}: {
  profile: Profile
  sources: FieldSources
  errors: ProfileErrors
  onChange: <F extends ProfileField>(field: F, value: Profile[F]) => void
}) {
  const role = profile.targetRole || "fullstack"
  const text = (field: "fullName" | "email" | "phone" | "location" | "college" | "degree" | "gradYear" | "githubUsername" | "linkedinUrl") => ({
    value: profile[field],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange(field, e.target.value),
  })

  const setProject = (index: number, patch: Partial<ProjectEntry>) =>
    onChange("projects", profile.projects.map((p, i) => (i === index ? { ...p, ...patch } : p)))
  const setExperience = (index: number, patch: Partial<ExperienceEntry>) =>
    onChange("experience", profile.experience.map((p, i) => (i === index ? { ...p, ...patch } : p)))

  const skillCount = Object.values(profile.skills).flat().length

  return (
    <div className="flex flex-col gap-3">
      <FormSection title="About you" defaultOpen>
        <Field label="Full name" required source={sources.fullName} error={errors.fullName} htmlFor="fullName">
          {({ id, describedBy, invalid }) => (
            <TextInput id={id} autoComplete="name" aria-describedby={describedBy} aria-invalid={invalid || undefined} {...text("fullName")} />
          )}
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Email" required source={sources.email} error={errors.email} htmlFor="email">
            {({ id, describedBy, invalid }) => (
              <TextInput id={id} type="email" inputMode="email" autoComplete="email" aria-describedby={describedBy} aria-invalid={invalid || undefined} {...text("email")} />
            )}
          </Field>
          <Field label="Phone" source={sources.phone} hint="Only shown if you choose to." htmlFor="phone">
            {({ id, describedBy }) => <TextInput id={id} type="tel" inputMode="tel" autoComplete="tel" aria-describedby={describedBy} {...text("phone")} />}
          </Field>
        </div>
        <Field label="City" source={sources.location} htmlFor="location">
          {({ id }) => <TextInput id={id} autoComplete="address-level2" placeholder="e.g. Bengaluru" {...text("location")} />}
        </Field>
      </FormSection>

      <FormSection title="What role are you aiming for?" defaultOpen>
        <fieldset>
          <legend className="sr-only">Target role</legend>
          <div className="flex flex-wrap gap-2">
            {TARGET_ROLES.map((r) => {
              const selected = profile.targetRole === r.value
              return (
                <label
                  key={r.value}
                  className={cn(
                    "inline-flex h-11 cursor-pointer items-center rounded-xl border px-4 text-sm transition-colors duration-(--dur-fast) has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring",
                    selected ? "border-transparent bg-tonal font-medium text-tonal-foreground" : "border-border hover:bg-muted"
                  )}
                >
                  <input
                    type="radio"
                    name="targetRole"
                    value={r.value}
                    checked={selected}
                    onChange={() => onChange("targetRole", r.value)}
                    className="sr-only"
                  />
                  {r.label}
                </label>
              )
            })}
          </div>
          {sources.targetRole === "resume" || sources.targetRole === "llm" ? (
            <p className="mt-2 text-caption text-muted-foreground">Picked from your resume. Change it if you&apos;re aiming elsewhere.</p>
          ) : null}
        </fieldset>
      </FormSection>

      <FormSection
        title="Education"
        summary={[profile.college, profile.gradYear].filter(Boolean).join(" · ") || "Add your college"}
        defaultOpen={!profile.college}
      >
        <Field label="College" source={sources.college} htmlFor="college">
          {({ id }) => <TextInput id={id} {...text("college")} />}
        </Field>
        <div className="grid gap-5 sm:grid-cols-[1fr_10rem]">
          <Field label="Degree" source={sources.degree} htmlFor="degree">
            {({ id }) => <TextInput id={id} placeholder="e.g. B.Tech, Computer Science" {...text("degree")} />}
          </Field>
          <Field label="Graduation year" source={sources.gradYear} error={errors.gradYear} htmlFor="gradYear">
            {({ id, describedBy, invalid }) => (
              <TextInput id={id} inputMode="numeric" maxLength={4} placeholder="2026" aria-describedby={describedBy} aria-invalid={invalid || undefined} {...text("gradYear")} />
            )}
          </Field>
        </div>
      </FormSection>

      <FormSection
        title="Skills"
        summary={skillCount ? `${skillCount} skills` : "Add your skills"}
        defaultOpen={skillCount === 0}
      >
        {SKILL_GROUPS.map((g) => (
          <Field key={g.key} label={g.label} source={sources.skills} htmlFor={`skills-${g.key}`}>
            {({ id }) => (
              <ChipInput
                id={id}
                label={g.label}
                value={profile.skills[g.key]}
                onChange={(next) => onChange("skills", { ...profile.skills, [g.key]: next })}
                placeholder={g.placeholder}
                suggestions={SKILL_SUGGESTIONS[role][g.key] ?? []}
              />
            )}
          </Field>
        ))}
      </FormSection>

      <FormSection
        title="Projects"
        summary={profile.projects.length ? profile.projects.map((p) => p.title).join(", ") : "Add a project"}
        defaultOpen={profile.projects.length === 0}
      >
        {profile.projects.map((project, index) => (
          <div key={project.id} className="flex flex-col gap-4 rounded-xl bg-surface p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-muted-foreground">Project {index + 1}</p>
              <button
                type="button"
                onClick={() => removeWithUndo(profile.projects, index, (next) => onChange("projects", next), "Project")}
                className="inline-flex size-11 items-center justify-center rounded-full text-muted-foreground hover:bg-danger-bg hover:text-danger"
                aria-label={`Remove project ${project.title || index + 1}`}
              >
                <Trash2 className="size-4" aria-hidden />
              </button>
            </div>
            <Field label="Title" htmlFor={`${project.id}-title`}>
              {({ id }) => <TextInput id={id} value={project.title} onChange={(e) => setProject(index, { title: e.target.value })} />}
            </Field>
            <Field label="What it does" hint="One or two sentences." htmlFor={`${project.id}-desc`}>
              {({ id, describedBy }) => (
                <TextArea
                  id={id}
                  aria-describedby={describedBy}
                  value={project.description}
                  onChange={(e) => setProject(index, { description: e.target.value })}
                />
              )}
            </Field>
            <Field label="Tech used" htmlFor={`${project.id}-tech`}>
              {({ id }) => (
                <ChipInput id={id} label="tech" value={project.tech} onChange={(tech) => setProject(index, { tech })} placeholder="e.g. React, Node.js" />
              )}
            </Field>
            <Field label="Link (GitHub or live demo)" htmlFor={`${project.id}-link`}>
              {({ id }) => (
                <TextInput id={id} type="url" inputMode="url" placeholder="https://github.com/…" value={project.link} onChange={(e) => setProject(index, { link: e.target.value })} />
              )}
            </Field>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            onChange("projects", [...profile.projects, { id: newId("proj"), title: "", description: "", tech: [], link: "", bullets: [] }])
          }
          className="inline-flex h-11 items-center gap-2 self-start rounded-full px-4 text-sm font-medium text-accent-text hover:bg-tonal/60"
        >
          <Plus className="size-4" aria-hidden />
          Add a project
        </button>
      </FormSection>

      <FormSection
        title="Experience"
        summary={profile.experience.length ? profile.experience.map((e) => e.company || e.role).join(", ") : "Internships, freelance, clubs (optional)"}
      >
        {profile.experience.map((entry, index) => (
          <div key={entry.id} className="flex flex-col gap-4 rounded-xl bg-surface p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Role {index + 1}</p>
              <button
                type="button"
                onClick={() => removeWithUndo(profile.experience, index, (next) => onChange("experience", next), "Role")}
                className="inline-flex size-11 items-center justify-center rounded-full text-muted-foreground hover:bg-danger-bg hover:text-danger"
                aria-label={`Remove ${entry.role || "role"} ${index + 1}`}
              >
                <Trash2 className="size-4" aria-hidden />
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Role" htmlFor={`${entry.id}-role`}>
                {({ id }) => <TextInput id={id} value={entry.role} onChange={(e) => setExperience(index, { role: e.target.value })} />}
              </Field>
              <Field label="Company or club" htmlFor={`${entry.id}-company`}>
                {({ id }) => <TextInput id={id} value={entry.company} onChange={(e) => setExperience(index, { company: e.target.value })} />}
              </Field>
            </div>
            <Field label="When" htmlFor={`${entry.id}-period`}>
              {({ id }) => <TextInput id={id} placeholder="Jun 2024 – Aug 2024" value={entry.period} onChange={(e) => setExperience(index, { period: e.target.value })} />}
            </Field>
            <Field label="What you did" hint="One point per line." htmlFor={`${entry.id}-bullets`}>
              {({ id, describedBy }) => (
                <TextArea
                  id={id}
                  aria-describedby={describedBy}
                  value={entry.bullets.join("\n")}
                  onChange={(e) => setExperience(index, { bullets: e.target.value.split("\n") })}
                />
              )}
            </Field>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange("experience", [...profile.experience, { id: newId("exp"), role: "", company: "", period: "", bullets: [] }])}
          className="inline-flex h-11 items-center gap-2 self-start rounded-full px-4 text-sm font-medium text-accent-text hover:bg-tonal/60"
        >
          <Plus className="size-4" aria-hidden />
          Add a role
        </button>
      </FormSection>

      <FormSection
        title="Links"
        summary={[profile.githubUsername && `github.com/${profile.githubUsername}`, profile.linkedinUrl && "LinkedIn"].filter(Boolean).join(" · ") || "GitHub and LinkedIn"}
        defaultOpen={!profile.githubUsername}
      >
        <Field label="GitHub username" source={sources.githubUsername} hint="Used for your portfolio and, later, your GitHub score." htmlFor="githubUsername">
          {({ id, describedBy }) => (
            <div className="flex items-center rounded-xl border border-input bg-card focus-within:border-primary focus-within:shadow-[inset_0_0_0_1px_var(--primary)]">
              <span className="pl-4 text-base text-muted-foreground">github.com/</span>
              <input
                id={id}
                aria-describedby={describedBy}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="h-12 min-w-0 flex-1 bg-transparent pr-4 text-base outline-none"
                value={profile.githubUsername}
                onChange={(e) => onChange("githubUsername", e.target.value.replace(/^.*github\.com\//i, "").replace(/\/.*$/, "").trim())}
              />
            </div>
          )}
        </Field>
        <Field label="LinkedIn profile link" source={sources.linkedinUrl} error={errors.linkedinUrl} htmlFor="linkedinUrl">
          {({ id, describedBy, invalid }) => (
            <TextInput id={id} type="url" inputMode="url" placeholder="https://www.linkedin.com/in/…" aria-describedby={describedBy} aria-invalid={invalid || undefined} {...text("linkedinUrl")} />
          )}
        </Field>
      </FormSection>
    </div>
  )
}
