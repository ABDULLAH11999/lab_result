import { Card } from "@/components/ui/card";

export default function OverallSummary({ summary }: { summary: string }) {
  return (
    <Card className="p-6">
      <p className="text-slate-700">{summary}</p>
    </Card>
  );
}
