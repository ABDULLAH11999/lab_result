import Link from "next/link";
import { getBlogs, getSettings } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import type { Metadata } from "next";
import { DEFAULT_SITE_KEYWORDS, normalizeBaseUrl, resolveMetadataImageUrl } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const settings = getSettings<any>();
  const baseUrl = normalizeBaseUrl(settings?.canonicalUrl);
  const ogImage = resolveMetadataImageUrl(baseUrl, settings?.ogImageUrl);
  return {
    title: "Lab Report Explanation Guides | Blood Test Results Blog",
    description: "Patient-friendly guides for CBC, CMP, cholesterol, thyroid, HbA1c, vitamin D, ferritin, liver, kidney, and blood test report questions.",
    keywords: DEFAULT_SITE_KEYWORDS,
    alternates: {
      canonical: `${baseUrl}/blog`
    },
    openGraph: {
      title: "Lab Report Explanation Guides | Blood Test Results Blog",
      description: "Patient-friendly guides for CBC, CMP, cholesterol, thyroid, HbA1c, vitamin D, ferritin, liver, kidney, and blood test report questions.",
      type: "website",
      url: `${baseUrl}/blog`,
      images: [{ url: ogImage, width: 1200, height: 630, alt: "LabExplain blog" }]
    },
    twitter: {
      title: "Lab Report Explanation Guides | Blood Test Results Blog",
      description: "Patient-friendly guides for CBC, CMP, cholesterol, thyroid, HbA1c, vitamin D, ferritin, liver, kidney, and blood test report questions.",
      images: [ogImage]
    }
  };
}

export default function BlogIndexPage() {
  const posts = getBlogs();
  const baseUrl = normalizeBaseUrl(getSettings<any>()?.canonicalUrl);
  const schema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "LabExplain Blog",
    url: `${baseUrl}/blog`,
    description: "Patient-friendly guides for CBC, CMP, cholesterol, thyroid, HbA1c, vitamin D, ferritin, liver, kidney, and blood test report questions.",
    blogPost: posts.slice(0, 24).map((post) => ({
      "@type": "BlogPosting",
      headline: post.seoTitle || post.title,
      url: post.canonicalUrl || `${baseUrl}/blog/${post.slug}`,
      datePublished: post.publishedAt,
      keywords: post.keywords?.join(", ")
    }))
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div className="mb-10">
        <h1 className="font-syne text-4xl font-bold text-slate-950">LabExplain Blog</h1>
        <p className="mt-3 text-slate-600">Educational guides built around the real lab questions patients search for.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {posts.map((post) => (
          <article key={post.id} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">{formatDate(post.publishedAt)}</p>
            <h2 className="mt-3 font-syne text-2xl font-bold text-slate-950">{post.title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{post.excerpt}</p>
            <Link href={`/blog/${post.slug}`} className="mt-5 inline-flex text-sm font-semibold text-blue-700">Read article</Link>
          </article>
        ))}
      </div>
    </div>
  );
}
