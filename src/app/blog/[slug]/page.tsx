import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBlogs, getSettings } from "@/lib/db";
import { MEDICAL_DISCLAIMER } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { normalizeBaseUrl } from "@/lib/seo";

export async function generateStaticParams() {
  return getBlogs().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogs().find((entry) => entry.slug === slug);
  if (!post) return {};
  const baseUrl = normalizeBaseUrl(getSettings<any>()?.canonicalUrl);
  const canonicalUrl = post.canonicalUrl?.replace(/^https?:\/\/localhost:\d+/, baseUrl) || `${baseUrl}/blog/${post.slug}`;

  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt,
    keywords: post.keywords,
    alternates: {
      canonical: canonicalUrl
    }
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getBlogs().find((entry) => entry.slug === slug);
  if (!post) notFound();
  const baseUrl = normalizeBaseUrl(getSettings<any>()?.canonicalUrl);
  const canonicalUrl = post.canonicalUrl?.replace(/^https?:\/\/localhost:\d+/, baseUrl) || `${baseUrl}/blog/${post.slug}`;

  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt,
    datePublished: post.publishedAt,
    author: { "@type": "Organization", name: "LabExplain" },
    publisher: { "@type": "Organization", name: "LabExplain" },
    keywords: post.keywords.join(", "),
    mainEntityOfPage: canonicalUrl
  };

  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">{formatDate(post.publishedAt)}</p>
      <h1 className="mt-4 font-syne text-5xl font-bold text-slate-950">{post.title}</h1>
      <p className="mt-4 text-lg leading-8 text-slate-600">{post.excerpt}</p>
      <div className="mt-10 space-y-5 text-[17px] leading-8 text-slate-700" dangerouslySetInnerHTML={{ __html: post.content }} />
      <div className="mt-10 rounded-3xl border border-sky-200 bg-sky-50 p-5 text-sm text-sky-900">{MEDICAL_DISCLAIMER}</div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    </article>
  );
}
