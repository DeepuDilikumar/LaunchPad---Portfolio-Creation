import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/thank-you", "/download", "/review", "/unsubscribe", "/drill"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
