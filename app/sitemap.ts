import type { MetadataRoute } from "next";
import { LEGAL_UPDATED } from "@/components/site/LegalPage";
import { lastUpdated } from "@/lib/changelog";
import { listGuideSlugs } from "@/lib/content/load";
import { readStatsFile } from "@/lib/content/stats";
import { listArticles } from "@/lib/learn";
import { visibleProducts } from "@/lib/catalog";
import { absoluteUrl } from "@/lib/seo";
import { buildRoadmapView } from "@/lib/roadmap/view";

/** Real lastmod dates: from the changelog, article frontmatter, the stats build and the legal pages. */
export default function sitemap(): MetadataRoute.Sitemap {
  const articles = listArticles();
  const contentDate = readStatsFile().generatedAt.slice(0, 10);
  const guides = listGuideSlugs();
  const latest = [contentDate, ...articles.map((a) => a.updated)].sort().at(-1)!;
  return [
    { url: absoluteUrl("/"), lastModified: latest },
    { url: absoluteUrl("/guides"), lastModified: contentDate },
    ...visibleProducts()
      .filter((p) => p.guides.length === 1 || p.status === "available")
      .map((p) => ({
        url: absoluteUrl(`/guides/${p.slug}`),
        lastModified: (guides.includes(p.slug) && lastUpdated(p.slug)) || contentDate,
      })),
    { url: absoluteUrl("/check"), lastModified: contentDate },
    { url: absoluteUrl("/roadmap/system-design"), lastModified: contentDate },
    ...buildRoadmapView()
      .topics.filter((t) => t.visible)
      .map((t) => ({ url: absoluteUrl(t.href), lastModified: contentDate })),
    { url: absoluteUrl("/learn"), lastModified: articles[0]?.updated ?? contentDate },
    ...articles.map((a) => ({ url: absoluteUrl(`/learn/${a.slug}`), lastModified: a.updated })),
    { url: absoluteUrl("/about"), lastModified: LEGAL_UPDATED },
    { url: absoluteUrl("/changelog"), lastModified: lastUpdated("backend") ?? contentDate },
    ...["/faq", "/contact", "/refund", "/terms", "/privacy"].map((p) => ({
      url: absoluteUrl(p),
      lastModified: LEGAL_UPDATED,
    })),
  ];
}
