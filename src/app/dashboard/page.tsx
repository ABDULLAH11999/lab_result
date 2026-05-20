import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getReports } from "@/lib/db";
import { Card } from "@/components/ui/card";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="font-syne text-4xl font-bold text-slate-950">Your Dashboard</h1>
        <p className="mt-4 text-slate-600">Create a free account to save your recent reports and follow trends over time.</p>
        <Link href="/auth/signup" className="mt-6 inline-flex rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white">Create free account</Link>
      </div>
    );
  }

  const reports = getReports<any>().filter((report) => report.userId === session.id).sort((a, b) => (
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ));

  return (
    <div className="mx-auto max-w-5xl px-6 py-14">
      <div className="mb-8">
        <h1 className="font-syne text-4xl font-bold text-slate-950">Welcome back</h1>
        <p className="mt-2 text-slate-600">Saved reports, trend prep, and plan status for {session.email}.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-slate-500">Plan</p>
          <p className="mt-2 font-syne text-2xl font-bold text-slate-950">{session.plan}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">Saved reports</p>
          <p className="mt-2 font-syne text-2xl font-bold text-slate-950">{reports.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">Trend tracking</p>
          <p className="mt-2 text-sm text-slate-700">{session.plan === "pro" ? "Enabled for saved values" : "Upgrade to Pro for long-term charts"}</p>
        </Card>
      </div>

      <div className="mt-8 space-y-4">
        {reports.length === 0 ? (
          <Card className="p-6">
            <p className="text-slate-700">No saved reports yet. Analyze a new report while logged in to start your history.</p>
          </Card>
        ) : (
          reports.map((report) => (
            <Card key={report.id} className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="font-syne text-xl font-bold text-slate-950">{report.reportName}</h2>
                <p className="mt-1 text-sm text-slate-500">{report.panelTypes.join(" · ")} · {new Date(report.createdAt).toLocaleDateString("en-US")}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{report.concernLevel}</span>
                <Link href={`/results/${report.id}`} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white">View</Link>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
