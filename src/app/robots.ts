import type { MetadataRoute } from "next";
import { getSettings } from "@/lib/db";

export default function robots(): MetadataRoute.Robots {
  const settings = getSettings<any>();
  const baseUrl = (settings?.canonicalUrl || process.env.NEXT_PUBLIC_APP_URL || "https://labexplain.online").replace(/\/$/, "");
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/dashboard"]
    },
    sitemap: [`${baseUrl}/sitemap.xml`, `${baseUrl}/feed.xml`]
  };
}
