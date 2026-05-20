import type { LabValue } from "@/types";

export default function LabValueCard({ value }: { value: LabValue }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-950">{value.name}</h3>
          <p className="font-mono text-sm text-slate-600">{value.raw}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{value.status}</span>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-700">{value.explanation}</p>
    </div>
  );
}
