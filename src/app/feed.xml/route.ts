import { getBlogs, getSettings } from "@/lib/db";
import { normalizeBaseUrl } from "@/lib/seo";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const settings = getSettings<any>();
  const baseUrl = normalizeBaseUrl(settings?.canonicalUrl);
  const posts = getBlogs().sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  const items = posts.slice(0, 100).map((post) => {
    const url = (post.canonicalUrl || `${baseUrl}/blog/${post.slug}`).replace(/^https?:\/\/localhost:\d+/, baseUrl);
    return `
      <item>
        <title>${escapeXml(post.seoTitle || post.title)}</title>
        <link>${escapeXml(url)}</link>
        <guid>${escapeXml(url)}</guid>
        <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
        <description>${escapeXml(post.seoDescription || post.excerpt)}</description>
      </item>`;
  }).join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0">
      <channel>
        <title>LabExplain Blog</title>
        <link>${baseUrl}/blog</link>
        <description>Patient-friendly guides for common lab report questions.</description>
        ${items}
      </channel>
    </rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400"
    }
  });
}
