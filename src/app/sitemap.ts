import type { MetadataRoute } from "next";
import { getBlogs, getSettings } from "@/lib/db";

export default function sitemap(): MetadataRoute.Sitemap {
  const settings = getSettings<any>();
  const baseUrl = (settings?.canonicalUrl || process.env.NEXT_PUBLIC_APP_URL || "https://labexplain.online").replace(/\/$/, "");
  const routes = ["", "/analyze", "/pricing", "/about", "/contact", "/privacy", "/terms", "/blog", "/auth/login", "/auth/signup", "/auth/register"];
  return [
    ...routes.map((route, index) => ({
      url: `${baseUrl}${route}`,
      priority: index === 0 ? 1 : 0.7,
      changeFrequency: "weekly" as const,
      lastModified: new Date()
    })),
    ...getBlogs().map((post) => ({
      url: (post.canonicalUrl || `${baseUrl}/blog/${post.slug}`).replace(/^https?:\/\/localhost:\d+/, baseUrl),
      priority: 0.8,
      changeFrequency: "weekly" as const,
      lastModified: post.publishedAt
    }))
  ];
}
