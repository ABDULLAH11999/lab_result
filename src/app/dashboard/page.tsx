import Link from "next/link";
import { ArrowRight, BarChart3, Clock3, FileSearch, FlaskConical, Sparkles } from "lucide-react";
import { getSession } from "@/lib/auth";
import { getReports } from "@/lib/db";
import { Card } from "@/components/ui/card";
import UpgradeButton from "@/components/billing/UpgradeButton";
import DashboardBillingCard from "@/components/billing/DashboardBillingCard";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="font-syne text-3xl font-bold text-slate-950 sm:text-4xl">Your Dashboard</h1>
        <p className="mt-4 text-slate-600">Create a free account to save your recent reports and follow trends over time.</p>
        <Link href="/auth/signup" className="mt-6 inline-flex rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white">Create free account</Link>
      </div>
    );
  }

  const reports = getReports<any>().filter((report) => report.userId === session.id).sort((a, b) => (
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <section className="glass-panel overflow-hidden rounded-[32px] px-6 py-8 sm:px-8 sm:py-10">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-70" />
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/60 px-3 py-1 text-xs font-semibold text-blue-700 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
              <Sparkles className="size-3.5" />
              Personal lab report workspace
            </div>
            <h1 className="font-syne text-3xl font-bold text-slate-950 sm:text-5xl">Welcome back</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              Saved reports, trend prep, and plan status for {session.email}.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/analyze" className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(37,99,235,0.24)] transition-transform duration-200 hover:-translate-y-0.5">
              <FlaskConical className="size-4" />
              Analyze new report
            </Link>
            {session.plan === "pro" ? (
              <Link href="#billing" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/70 bg-white/70 px-5 py-3 text-sm font-semibold text-slate-700 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur hover:text-slate-950">
                <BarChart3 className="size-4" />
                View billing
              </Link>
            ) : (
              <UpgradeButton authenticated className="inline-flex items-center justify-center gap-2 rounded-full border border-white/70 bg-white/70 px-5 py-3 text-sm font-semibold text-slate-700 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur hover:text-slate-950">
                <>
                  <BarChart3 className="size-4" />
                  Upgrade
                </>
              </UpgradeButton>
            )}
          </div>
        </div>
      </section>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Card className="glass-card border-white/70 p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-slate-500">Plan</p>
            <Sparkles className="icon-float size-4 text-cyan-600" />
          </div>
          <p className="font-syne text-3xl font-bold capitalize text-slate-950">{session.plan}</p>
          <p className="mt-2 text-sm text-slate-600">{session.plan === "pro" ? "Unlimited analysis and history are active." : "Free account with saved report access."}</p>
        </Card>

        <Card className="glass-card border-white/70 p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-slate-500">Saved reports</p>
            <FileSearch className="icon-float size-4 text-blue-600" />
          </div>
          <p className="font-syne text-3xl font-bold text-slate-950">{reports.length}</p>
          <p className="mt-2 text-sm text-slate-600">{reports.length === 0 ? "Your report library starts with the next analysis." : "Recent report history is ready for review."}</p>
        </Card>

        <Card className="glass-card border-white/70 p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-slate-500">Trend tracking</p>
            <Clock3 className="icon-float size-4 text-sky-600" />
          </div>
          <p className="font-syne text-xl font-bold text-slate-950">{session.plan === "pro" ? "Enabled" : "Locked"}</p>
          <p className="mt-2 text-sm text-slate-600">{session.plan === "pro" ? "We will keep lab value history ready for long-term comparison." : "Upgrade to Pro for long-term charts and full report history."}</p>
        </Card>
      </div>

      <div className="mt-8">
        <DashboardBillingCard />
      </div>

      <div className="mt-8 space-y-4">
        {reports.length === 0 ? (
          <Card className="glass-card border-white/70 p-8">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-syne text-2xl font-bold text-slate-950">No saved reports yet</h2>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">Analyze a new report while logged in to start your history, save your summaries, and build toward trend comparisons.</p>
              </div>
              <Link href="/analyze" className="inline-flex items-center gap-2 rounded-full bg-white/80 px-5 py-3 text-sm font-semibold text-blue-700 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur hover:text-blue-800">
                Start analysis
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </Card>
        ) : (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-syne text-2xl font-bold text-slate-950">Recent reports</h2>
              <Link href="/analyze" className="text-sm font-semibold text-blue-700">Analyze another</Link>
            </div>
            <div className="grid gap-4">
              {reports.map((report) => (
                <Card key={report.id} className="glass-card border-white/70 p-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="font-syne text-xl font-bold text-slate-950">{report.reportName}</h3>
                      <p className="mt-1 text-sm text-slate-500">{report.panelTypes.join(" · ")} · {new Date(report.createdAt).toLocaleDateString("en-US")}</p>
                    </div>
                    <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                      <span className="rounded-full border border-white/80 bg-white/75 px-3 py-1 text-xs font-semibold capitalize text-slate-700 shadow-[0_8px_20px_rgba(15,23,42,0.05)]">
                        {report.concernLevel}
                      </span>
                      <Link href={`/results/${report.id}`} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(37,99,235,0.2)]">
                        Open report
                        <ArrowRight className="size-4" />
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
