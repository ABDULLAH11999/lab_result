import Link from "next/link";
import { getBlogs } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export default function BlogIndexPage() {
  const posts = getBlogs();

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
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
