import type { MetadataRoute } from "next";
import { APP_URL } from "@/lib/constants";
import { getBlogs } from "@/lib/db";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/analyze", "/pricing", "/about", "/contact", "/privacy", "/terms", "/blog"];
  return [
    ...routes.map((route, index) => ({
      url: `${APP_URL}${route}`,
      priority: index === 0 ? 1 : 0.7,
      changeFrequency: "weekly" as const
    })),
    ...getBlogs().map((post) => ({
      url: `${APP_URL}/blog/${post.slug}`,
      priority: 0.8,
      changeFrequency: "monthly" as const
    }))
  ];
}
