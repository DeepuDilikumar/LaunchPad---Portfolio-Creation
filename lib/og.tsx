import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { site } from "@/config/site";

export const ogSize = { width: 1200, height: 630 };

async function fonts() {
  const dir = path.join(process.cwd(), "node_modules", "geist", "dist", "fonts", "geist-sans");
  const [regular, medium] = await Promise.all([readFile(path.join(dir, "Geist-Regular.ttf")), readFile(path.join(dir, "Geist-Medium.ttf"))]);
  return [
    { name: "Geist", data: regular, weight: 400 as const, style: "normal" as const },
    { name: "Geist", data: medium, weight: 500 as const, style: "normal" as const },
  ];
}

function CaretMark({ size = 40 }: { size?: number }) {
  return (
    <div style={{ display: "flex", width: size * 0.42, height: size, borderRadius: size * 0.12, background: "#F5F5F5", position: "relative" }}>
      <div style={{ position: "absolute", top: size * 0.23, left: size * 0.08, width: size * 0.075, height: size * 0.075, background: "#0A0A0A" }} />
      <div style={{ position: "absolute", top: size * 0.23, right: size * 0.08, width: size * 0.075, height: size * 0.075, background: "#0A0A0A" }} />
    </div>
  );
}

/** One OG layout for the site: black, a soft glow, title, subtitle, small chips. */
export async function ogImage({ eyebrow, title, subtitle, accent, chips = [] }: { eyebrow?: string; title: string; subtitle?: string; accent?: string; chips?: string[] }) {
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
          background: "radial-gradient(80% 60% at 50% 120%, #2a2a2a 0%, #000000 70%)",
          color: "#F5F5F5",
          fontFamily: "Geist",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <CaretMark size={44} />
          <span style={{ fontSize: 30, fontWeight: 500 }}>{site.name}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {eyebrow ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 28, color: "#9B9B9B" }}>
              {accent ? <div style={{ width: 22, height: 22, borderRadius: 6, background: accent }} /> : null}
              {eyebrow}
            </div>
          ) : null}
          <div style={{ fontSize: title.length > 40 ? 60 : 76, fontWeight: 500, letterSpacing: "-0.03em", lineHeight: 1.05 }}>{title}</div>
          {subtitle ? <div style={{ fontSize: 30, color: "#9B9B9B", lineHeight: 1.35, maxWidth: 980 }}>{subtitle}</div> : null}
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          {chips.slice(0, 4).map((c) => (
            <div key={c} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 24, padding: "10px 20px", borderRadius: 999, background: "#1C1C1C", color: c.startsWith("✓") ? "#3CCFB4" : "#F5F5F5" }}>
              {c}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...ogSize, fonts: await fonts() },
  );
}
