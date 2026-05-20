import AnalyzePageClient from "@/components/analyze/AnalyzePageClient";
import type { Metadata } from "next";
import { getSettings } from "@/lib/db";
import { DEFAULT_SITE_KEYWORDS, normalizeBaseUrl } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const settings = getSettings<any>();
  const baseUrl = normalizeBaseUrl(settings?.canonicalUrl);

  return {
    title: "Free Lab Report Analyzer | Scan or Upload Medical Reports",
    description: "Paste, upload, or scan your medical report for a free lab report summary, blood test explanation, and doctor question list.",
    keywords: DEFAULT_SITE_KEYWORDS,
    alternates: {
      canonical: `${baseUrl}/analyze`
    }
  };
}

export default async function AnalyzePage({
  searchParams
}: {
  searchParams: Promise<{ sample?: string }>;
}) {
  const params = await searchParams;
  return <AnalyzePageClient sampleEnabled={params.sample === "true"} />;
}
