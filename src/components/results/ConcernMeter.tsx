export default function ConcernMeter({ score }: { score: number }) {
  return (
    <div className="rounded-2xl bg-slate-100 p-4">
      <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
        <span>Concern score</span>
        <span>{score}/100</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.max(4, Math.min(score, 100))}%` }} />
      </div>
    </div>
  );
}
