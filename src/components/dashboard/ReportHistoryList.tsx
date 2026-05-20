import Link from "next/link";

export default function ReportHistoryList({ reports }: { reports: any[] }) {
  return (
    <div className="space-y-3">
      {reports.map((report) => (
        <div key={report.id} className="rounded-2xl border border-slate-200 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-slate-950">{report.reportName}</h3>
              <p className="text-sm text-slate-500">{report.panelTypes?.join(" · ")}</p>
            </div>
            <Link href={`/results/${report.id}`} className="text-sm font-semibold text-blue-700">Open</Link>
          </div>
        </div>
      ))}
    </div>
  );
}
