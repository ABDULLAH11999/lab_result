import { Card } from "@/components/ui/card";

export default function ValueTrendCard({ label, summary }: { label: string; summary: string }) {
  return (
    <Card className="p-5">
      <h3 className="font-syne text-xl font-bold text-slate-950">{label}</h3>
      <p className="mt-2 text-sm text-slate-600">{summary}</p>
    </Card>
  );
}
