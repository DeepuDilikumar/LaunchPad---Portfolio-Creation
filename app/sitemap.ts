import type { MetadataRoute } from "next";
import { site } from "@/config/site";
import { catalog } from "@/content/catalog";
import { projectSummaries } from "@/lib/content";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = site.url.replace(/\/$/, "");
  const now = new Date();
  const pages = ["", "/projects", "/pricing", "/contact", "/legal/terms", "/legal/privacy", "/legal/refunds"].map((p) => ({
    url: `${base}${p}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : 0.7,
  }));
  const projects = catalog.map((p) => ({ url: `${base}/projects/${p.slug}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.8 }));
  // Only modules a logged-out visitor can read fully.
  const modules = catalog.flatMap((p) =>
    projectSummaries(p.slug)
      .filter((m) => m.free && m.status === "published")
      .map((m) => ({ url: `${base}/learn/${p.slug}/${m.slug}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.6 })),
  );
  return [...pages, ...projects, ...modules];
}
