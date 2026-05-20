import fs from "fs";
import path from "path";
import { getBlogs, getSettings } from "@/lib/db";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function buildSitemapXml() {
  const settings = getSettings<any>();
  const baseUrl = (settings?.canonicalUrl || process.env.NEXT_PUBLIC_APP_URL || "https://labexplain.online").replace(/\/$/, "");
  const blogs = getBlogs();
  const today = new Date().toISOString().split("T")[0];

  const staticRoutes = [
    { path: "", changefreq: "daily", priority: "1.0" },
    { path: "/analyze", changefreq: "weekly", priority: "0.9" },
    { path: "/pricing", changefreq: "weekly", priority: "0.8" },
    { path: "/blog", changefreq: "daily", priority: "0.8" },
    { path: "/about", changefreq: "monthly", priority: "0.6" },
    { path: "/contact", changefreq: "monthly", priority: "0.6" },
    { path: "/privacy", changefreq: "yearly", priority: "0.3" },
    { path: "/terms", changefreq: "yearly", priority: "0.3" },
    { path: "/auth/login", changefreq: "monthly", priority: "0.5" },
    { path: "/auth/signup", changefreq: "monthly", priority: "0.5" },
    { path: "/auth/register", changefreq: "monthly", priority: "0.5" }
  ];

  const staticXml = staticRoutes
    .map(
      (route) => `
  <url>
    <loc>${escapeXml(`${baseUrl}${route.path}`)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`
    )
    .join("");

  const blogXml = blogs
    .map((blog: any) => {
      const canonical = (blog.canonicalUrl || `${baseUrl}/blog/${blog.slug}`)
        .replace(/^https?:\/\/localhost:\d+/, baseUrl)
        .replace(/\/$/, "");
      const lastmod = blog.publishedAt || today;
      return `
  <url>
    <loc>${escapeXml(canonical)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${staticXml}${blogXml}
</urlset>
`;
}

export function updateStaticSitemap() {
  const xml = buildSitemapXml();
  const publicPath = path.join(process.cwd(), "public", "sitemap.xml");
  const rootPath = path.join(process.cwd(), "sitemap.xml");

  fs.writeFileSync(publicPath, xml);
  fs.writeFileSync(rootPath, xml);
}
