import AnalyzePageClient from "@/components/analyze/AnalyzePageClient";

export default async function AnalyzePage({
  searchParams
}: {
  searchParams: Promise<{ sample?: string }>;
}) {
  const params = await searchParams;
  return <AnalyzePageClient sampleEnabled={params.sample === "true"} />;
}
