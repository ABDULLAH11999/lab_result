import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBlogs, getSettings } from "@/lib/db";
import { MEDICAL_DISCLAIMER } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { normalizeBaseUrl, resolveMetadataImageUrl } from "@/lib/seo";

export async function generateStaticParams() {
  return getBlogs().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogs().find((entry) => entry.slug === slug);
  if (!post) return {};
  const settings = getSettings<any>();
  const baseUrl = normalizeBaseUrl(settings?.canonicalUrl);
  const canonicalUrl = post.canonicalUrl?.replace(/^https?:\/\/localhost:\d+/, baseUrl) || `${baseUrl}/blog/${post.slug}`;
  const ogImage = resolveMetadataImageUrl(baseUrl, post.cover || settings?.ogImageUrl);

  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt,
    keywords: post.keywords,
    alternates: {
      canonical: canonicalUrl
    },
    openGraph: {
      type: "article",
      url: canonicalUrl,
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.excerpt,
      publishedTime: post.publishedAt,
      images: [{ url: ogImage, width: 1200, height: 630, alt: post.title }]
    },
    twitter: {
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.excerpt,
      images: [ogImage]
    }
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const posts = getBlogs();
  const post = posts.find((entry) => entry.slug === slug);
  if (!post) notFound();
  const settings = getSettings<any>();
  const baseUrl = normalizeBaseUrl(settings?.canonicalUrl);
  const canonicalUrl = post.canonicalUrl?.replace(/^https?:\/\/localhost:\d+/, baseUrl) || `${baseUrl}/blog/${post.slug}`;
  const ogImage = resolveMetadataImageUrl(baseUrl, post.cover || settings?.ogImageUrl);
  const relatedPosts = posts.filter((entry) => entry.slug !== post.slug).filter((entry) =>
    entry.keywords?.some((keyword) => post.keywords?.includes(keyword)) ||
    entry.tags?.some((tag) => post.tags?.includes(tag))
  ).slice(0, 3);

  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    image: [ogImage],
    author: { "@type": "Organization", name: "LabExplain" },
    publisher: {
      "@type": "Organization",
      name: "LabExplain",
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/favicon.svg`
      }
    },
    keywords: post.keywords.join(", "),
    mainEntityOfPage: canonicalUrl
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: baseUrl },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${baseUrl}/blog` },
      { "@type": "ListItem", position: 3, name: post.title, item: canonicalUrl }
    ]
  };

  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-slate-500">
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/" className="hover:text-slate-900">Home</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-slate-900">Blog</Link>
          <span>/</span>
          <span className="text-slate-700">{post.title}</span>
        </div>
      </nav>
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">{formatDate(post.publishedAt)}</p>
      <h1 className="mt-4 font-syne text-5xl font-bold text-slate-950">{post.title}</h1>
      <p className="mt-4 text-lg leading-8 text-slate-600">{post.excerpt}</p>
      <div className="mt-10 space-y-5 text-[17px] leading-8 text-slate-700" dangerouslySetInnerHTML={{ __html: post.content }} />
      {relatedPosts.length ? (
        <section className="mt-12">
          <h2 className="font-syne text-2xl font-bold text-slate-950">Related guides</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {relatedPosts.map((entry) => (
              <Link key={entry.id} href={`/blog/${entry.slug}`} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">{formatDate(entry.publishedAt)}</p>
                <h3 className="mt-3 font-syne text-lg font-bold text-slate-950">{entry.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{entry.excerpt}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
      <div className="mt-10 rounded-3xl border border-sky-200 bg-sky-50 p-5 text-sm text-sky-900">{MEDICAL_DISCLAIMER}</div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
    </article>
  );
}
