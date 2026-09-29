import { ImageResponse } from "next/og"

export const alt = "LaunchPad — Your resume, live as a portfolio in 2 minutes"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

/** Share card for the landing page (WhatsApp, LinkedIn, Meta ads previews). */
export default function OpengraphImage() {
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
          background: "#09090B",
          color: "#FAFAFA",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <svg width="56" height="56" viewBox="0 0 32 32">
            <rect width="32" height="32" rx="8" fill="#2563EB" />
            <path
              d="M10 17.5 16 11.5l6 6"
              fill="none"
              stroke="#fff"
              strokeWidth="2.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M10 22.5h12" stroke="#fff" strokeWidth="2.75" strokeLinecap="round" />
          </svg>
          <span style={{ fontSize: 36, fontWeight: 600 }}>LaunchPad</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <span style={{ fontSize: 72, fontWeight: 600, lineHeight: 1.05, letterSpacing: -2 }}>
            Your resume, live as a portfolio in 2 minutes.
          </span>
          <span style={{ fontSize: 32, color: "#A1A1AA" }}>
            Then build one real project in 14 days, with your own commits.
          </span>
        </div>
        <span style={{ fontSize: 26, color: "#60A5FA" }}>Free to start · No sign-up</span>
      </div>
    ),
    size
  )
}
