import ResultsClient from "@/components/results/ResultsClient";

export default async function ResultsReportPage({ params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  return <ResultsClient reportId={reportId} />;
}
