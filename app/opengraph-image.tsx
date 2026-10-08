import { ogImage, ogSize } from "@/lib/og";
import { site } from "@/config/site";

export const size = ogSize;
export const contentType = "image/png";
export const alt = site.tagline;

export default async function Image() {
  return ogImage({ title: site.tagline, subtitle: "Six production-grade apps with Claude Code or Codex, and public proof of how you built them.", chips: ["Foundations is free", "Claude Code + Codex"] });
}
