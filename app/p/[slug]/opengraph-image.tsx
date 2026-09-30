import { ImageResponse } from "next/og"

import { getPublishedPortfolio } from "@/lib/data/portfolios"

export const alt = "Portfolio"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

/** Per-student share card, so WhatsApp and LinkedIn previews show their name and role. */
export default async function PortfolioOgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const row = await getPublishedPortfolio(slug)
  const name = row?.content.profile.fullName ?? "Portfolio"
  const headline = row?.content.headline ?? ""
  const skills = row
    ? [...row.content.profile.skills.languages, ...row.content.profile.skills.frameworks].slice(0, 5)
    : []
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("")

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#ffffff",
          color: "#202124",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              background: "#e8f0fe",
              color: "#174ea6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 52,
            }}
          >
            {initials}
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 68, letterSpacing: -1.5 }}>{name}</span>
            <span style={{ fontSize: 34, color: "#1a73e8" }}>{headline}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          {skills.map((s) => (
            <span
              key={s}
              style={{ fontSize: 28, padding: "10px 22px", borderRadius: 999, border: "2px solid #dadce0", color: "#3c4043" }}
            >
              {s}
            </span>
          ))}
        </div>
        <span style={{ fontSize: 26, color: "#5f6368" }}>launchpad · /p/{slug}</span>
      </div>
    ),
    size
  )
}
