import { ImageResponse } from "next/og";
import { site } from "@/config/site";
import { ogFonts } from "@/lib/og-fonts";
import { loadQuiz } from "@/lib/quiz-data";

export const runtime = "nodejs";

/** Share image for a Readiness Check result. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const total = 8;
  const s = Math.max(0, Math.min(total, Number(url.searchParams.get("s")) || 0));
  const area = loadQuiz("backend").areas.find((a) => a.id === url.searchParams.get("w"));
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "56px 64px",
        background: "#F5F1E6",
        fontFamily: "Plex Sans",
        color: "#1C1A16",
      }}
    >
      <div
        style={{ fontFamily: "Plex Mono", fontSize: 26, color: "#5C5648" }}
      >{`// ${site.name} · readiness check`}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div
          style={{ fontFamily: "Bricolage", fontSize: 120, lineHeight: 1 }}
        >{`${s} of ${total} strong`}</div>
        {area ? (
          <div
            style={{
              fontFamily: "Bricolage",
              fontSize: 50,
              background: "#FFE36E",
              padding: "4px 12px",
              alignSelf: "flex-start",
            }}
          >{`weak spot: ${area.title.toLowerCase()}`}</div>
        ) : null}
        <div style={{ display: "flex", gap: 8 }}>
          {Array.from({ length: total }, (_, i) => (
            <div
              key={i}
              style={{
                width: 90,
                height: 16,
                borderRadius: 8,
                background: i < s ? "#2340B0" : "#DCD4C2",
              }}
            />
          ))}
        </div>
      </div>
      <div
        style={{ fontFamily: "Caveat", fontSize: 40, color: "#C2412D" }}
      >{`how many would you get? ${site.domain}/check`}</div>
    </div>,
    { width: 1200, height: 630, fonts: ogFonts() },
  );
}
