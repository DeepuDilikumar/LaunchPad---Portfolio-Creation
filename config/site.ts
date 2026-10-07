/**
 * Brand and site-wide settings. Change the brand name here and nowhere else.
 */
export const site = {
  name: "Buildproof",
  /** Used for <meta name="{verifyMetaName}"> on learners' deployments. */
  verifyMetaName: "buildproof-verify",
  tagline: "Build what big tech runs",
  description:
    "Hands-on notebooks that take you through six production-grade apps with Claude Code or Codex. Then turn each one into proof that gets you hired.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  supportEmail: "hello@buildproof.dev",
  /** Landing S6. Leave src empty to hide the section. */
  video: {
    src: "",
    poster: "/media/video-poster.svg",
    captions: "",
    title: "Watch one module, start to finish",
  },
  nav: [
    {
      group: "Learn",
      links: [
        { label: "Projects", href: "/projects" },
        { label: "Foundations", href: "/projects/foundations" },
        { label: "Pricing", href: "/pricing" },
      ],
    },
    {
      group: "Proof",
      links: [
        { label: "Build journal", href: "/journal" },
        { label: "Dashboard", href: "/dashboard" },
      ],
    },
    {
      group: "Company",
      links: [
        { label: "Teams and colleges", href: "/contact" },
        { label: "Sign in", href: "/login" },
      ],
    },
  ],
  footer: [
    {
      title: "Learn",
      links: [
        { label: "Foundations", href: "/projects/foundations" },
        { label: "All projects", href: "/projects" },
        { label: "Pricing", href: "/pricing" },
        { label: "Start free", href: "/login" },
      ],
    },
    {
      title: "Projects",
      links: [
        { label: "Pulse", href: "/projects/pulse" },
        { label: "Ledger", href: "/projects/ledger" },
        { label: "Reel", href: "/projects/reel" },
        { label: "Dispatch", href: "/projects/dispatch" },
        { label: "Scribe", href: "/projects/scribe" },
        { label: "Atlas", href: "/projects/atlas" },
      ],
    },
    {
      title: "Proof",
      links: [
        { label: "Build journal", href: "/journal" },
        { label: "Proof packs", href: "/dashboard" },
        { label: "Sample profile", href: "/u/sample" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "Teams and colleges", href: "/contact" },
        { label: "Contact", href: "/contact" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Terms", href: "/legal/terms" },
        { label: "Privacy", href: "/legal/privacy" },
        { label: "Refunds", href: "/legal/refunds" },
      ],
    },
  ],
} as const;

export type Site = typeof site;
