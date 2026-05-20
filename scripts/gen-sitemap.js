const fs = require("fs");
const path = require("path");

const dataDir = path.join(process.cwd(), "data");
const blogsPath = path.join(dataDir, "blogs.json");
const settingsPath = path.join(dataDir, "settings.json");
const publicPath = path.join(process.cwd(), "public", "sitemap.xml");
const rootPath = path.join(process.cwd(), "sitemap.xml");

function readJson(file, fallback) {
  try {
    if (!fs.existsSync(file)) return fallback;
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const settings = readJson(settingsPath, {});
const blogs = readJson(blogsPath, []);
const baseUrl = (settings.canonicalUrl || "https://labexplain.online").replace(/\/$/, "");
const today = new Date().toISOString().split("T")[0];

const routes = [
  ["", "daily", "1.0"],
  ["/analyze", "weekly", "0.9"],
  ["/pricing", "weekly", "0.8"],
  ["/blog", "daily", "0.8"],
  ["/about", "monthly", "0.6"],
  ["/contact", "monthly", "0.6"],
  ["/privacy", "yearly", "0.3"],
  ["/terms", "yearly", "0.3"],
  ["/auth/login", "monthly", "0.5"],
  ["/auth/signup", "monthly", "0.5"],
  ["/auth/register", "monthly", "0.5"]
];

const staticXml = routes
  .map(
    ([route, changefreq, priority]) => `
  <url>
    <loc>${escapeXml(`${baseUrl}${route}`)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
  )
  .join("");

const blogXml = blogs
  .map((blog) => `
  <url>
    <loc>${escapeXml((blog.canonicalUrl || `${baseUrl}/blog/${blog.slug}`).replace(/^https?:\/\/localhost:\d+/, baseUrl).replace(/\/$/, ""))}</loc>
    <lastmod>${blog.publishedAt || today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`)
  .join("");

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${staticXml}${blogXml}
</urlset>
`;

fs.mkdirSync(path.dirname(publicPath), { recursive: true });
fs.writeFileSync(publicPath, sitemap);
fs.writeFileSync(rootPath, sitemap);

console.log(`Generated sitemap with ${routes.length + blogs.length} URLs.`);
