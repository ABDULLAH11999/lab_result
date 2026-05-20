import type { LabPanel } from "@/types";
import LabValueCard from "@/components/results/LabValueCard";

export default function PanelSection({ panel }: { panel: LabPanel }) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-syne text-2xl font-bold text-slate-950">{panel.name}</h2>
        <p className="text-sm text-slate-500">{panel.values.length} values</p>
      </div>
      <div className="space-y-3">
        {panel.values.map((value) => (
          <LabValueCard key={`${panel.name}-${value.name}`} value={value} />
        ))}
      </div>
    </section>
  );
}
