import { ImageResponse } from "next/og";
import { site } from "@/config/site";
import { ogFonts } from "@/lib/og-fonts";

export const runtime = "nodejs";

/** 1200×630 preview image for any page: /og?title=…&kicker=…&note=… */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const title = (url.searchParams.get("title") ?? site.name).slice(0, 120);
  const kicker = (url.searchParams.get("kicker") ?? "for engineers switching jobs · 2–8 yrs").slice(
    0,
    80,
  );
  const note = url.searchParams.get("note")?.slice(0, 60);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "56px 64px",
        backgroundColor: "#F5F1E6",
        backgroundImage:
          "linear-gradient(rgba(35,64,176,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(35,64,176,0.08) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
        fontFamily: "Plex Sans",
        color: "#1C1A16",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 12,
            background: "#1C1A16",
            color: "#FFE36E",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "Plex Mono",
            fontSize: 22,
          }}
        >
          {site.logoMark}
        </div>
        <div style={{ fontFamily: "Bricolage", fontSize: 34 }}>{site.name}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div
          style={{ fontFamily: "Plex Mono", fontSize: 24, color: "#5C5648" }}
        >{`// ${kicker}`}</div>
        <div
          style={{
            fontFamily: "Bricolage",
            fontSize: title.length > 60 ? 58 : 72,
            lineHeight: 1.04,
            letterSpacing: "-0.03em",
            maxWidth: 1040,
          }}
        >
          {title}
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div
          style={{
            fontFamily: "Caveat",
            fontSize: 40,
            color: "#C2412D",
            transform: "rotate(-2deg)",
          }}
        >
          {note ?? "the second question decides the offer"}
        </div>
        <div style={{ fontFamily: "Plex Mono", fontSize: 22, color: "#5C5648" }}>{site.domain}</div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: ogFonts(),
      headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800" },
    },
  );
}
