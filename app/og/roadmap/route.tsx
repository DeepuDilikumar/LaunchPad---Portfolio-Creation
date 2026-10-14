import { ImageResponse } from "next/og";
import { site } from "@/config/site";
import { ogFonts } from "@/lib/og-fonts";

export const runtime = "nodejs";

/** 1080×1350 progress card for LinkedIn and Instagram: /og/roadmap?ready=12&total=40&readiness=54&path=minimum */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const total = Math.max(1, Math.min(200, Number(u.searchParams.get("total")) || 1));
  const ready = Math.max(0, Math.min(total, Number(u.searchParams.get("ready")) || 0));
  const readiness = Math.max(0, Math.min(100, Number(u.searchParams.get("readiness")) || 0));
  const minimum = u.searchParams.get("path") !== "all";
  const cells = Math.min(total, 40);
  const filled = Math.round((ready / total) * cells);
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px",
        background: "#F5F1E6",
        fontFamily: "Plex Sans",
        color: "#1C1A16",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 14,
            background: "#1C1A16",
            color: "#FFE36E",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "Plex Mono",
            fontSize: 26,
          }}
        >
          {site.logoMark}
        </div>
        <div style={{ fontFamily: "Bricolage", fontSize: 40 }}>{site.name}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div
          style={{ fontFamily: "Plex Mono", fontSize: 30, color: "#5C5648" }}
        >{`// system design roadmap · ${minimum ? "minimum path" : "everything"}`}</div>
        <div
          style={{ fontFamily: "Bricolage", fontSize: 150, lineHeight: 1 }}
        >{`${ready} / ${total}`}</div>
        <div
          style={{
            fontFamily: "Bricolage",
            fontSize: 58,
            background: "#FFE36E",
            padding: "4px 14px",
            alignSelf: "flex-start",
          }}
        >
          {ready === total ? "interview-ready" : "topics interview-ready"}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 10 }}>
          {Array.from({ length: cells }, (_, i) => (
            <div
              key={i}
              style={{
                width: 82,
                height: 22,
                borderRadius: 11,
                background: i < filled ? "#2E7A4B" : "#DCD4C2",
              }}
            />
          ))}
        </div>
        <div style={{ fontFamily: "Plex Mono", fontSize: 32 }}>{`HLD readiness ${readiness}%`}</div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div style={{ fontFamily: "Caveat", fontSize: 50, color: "#C2412D" }}>
          next: the follow-ups →
        </div>
        <div
          style={{ fontFamily: "Plex Mono", fontSize: 28, color: "#5C5648" }}
        >{`${site.domain}/roadmap`}</div>
      </div>
    </div>,
    { width: 1080, height: 1350, fonts: ogFonts() },
  );
}
