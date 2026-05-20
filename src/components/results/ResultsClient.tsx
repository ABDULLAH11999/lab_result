"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Copy, MessageSquare, Save } from "lucide-react";
import type { AnalysisResult, ValueStatus } from "@/types";
import { Card } from "@/components/ui/card";

const statusStyles: Record<ValueStatus, string> = {
  normal: "bg-emerald-50 text-emerald-700 border-emerald-200",
  low: "bg-amber-50 text-amber-700 border-amber-200",
  high: "bg-rose-50 text-rose-700 border-rose-200",
  critical_low: "bg-rose-100 text-rose-900 border-rose-300",
  critical_high: "bg-rose-100 text-rose-900 border-rose-300"
};

export default function ResultsClient({
  initialResult,
  reportId
}: {
  initialResult?: AnalysisResult | null;
  reportId?: string;
}) {
  const [result, setResult] = useState<AnalysisResult | null>(initialResult || null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    if (initialResult) return;

    if (reportId) {
      fetch(`/api/reports/${reportId}`)
        .then((res) => res.json())
        .then((data) => {
          startTransition(() => {
            setResult(data.report || null);
          });
        });
      return;
    }

    const stored = sessionStorage.getItem("lab_result");
    if (stored) {
      startTransition(() => {
        setResult(JSON.parse(stored));
      });
      return;
    }

    router.push("/analyze");
  }, [initialResult, reportId, router]);

  if (!result) {
    return <div className="mx-auto max-w-3xl px-6 py-24 text-center text-slate-500">Loading your report...</div>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-syne text-3xl font-bold text-slate-950">Your Results Explained</h1>
          <p className="text-sm text-slate-500">{result.detectedPanels.join(" · ") || "Lab report"}</p>
        </div>
        <Link href="/analyze" className="text-sm font-semibold text-blue-700">Analyze another</Link>
      </div>

      <Card className="p-6">
        <div className="mb-3 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          Concern level: {result.concernLevel}
        </div>
        <p className="text-slate-700">{result.overallSummary}</p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <span className="text-slate-600">{result.allValues.length} total values</span>
          <span className="text-rose-700">{result.allValues.filter((value) => value.status !== "normal").length} flagged</span>
          <span className="text-emerald-700">{result.allValues.filter((value) => value.status === "normal").length} normal</span>
        </div>
      </Card>

      {result.panels.map((panel) => (
        <Card key={panel.name} className="overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
            <h2 className="font-syne text-xl font-bold text-slate-950">{panel.name}</h2>
            <p className="text-sm text-slate-500">{panel.values.length} values</p>
          </div>
          <div className="space-y-4 p-6">
            {panel.values.map((value) => (
              <div key={`${panel.name}-${value.name}`} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      {value.status === "normal" ? (
                        <CheckCircle2 className="size-4 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="size-4 text-amber-600" />
                      )}
                      <h3 className="font-semibold text-slate-950">{value.name}</h3>
                    </div>
                    <p className="mt-1 font-mono text-sm text-slate-600">{value.raw}</p>
                    {value.referenceRange ? (
                      <p className="mt-1 text-xs text-slate-500">Reference range: {value.referenceRange}</p>
                    ) : null}
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles[value.status]}`}>
                    {value.status.replace("_", " ")}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-700">{value.explanation}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600"><strong>Why it matters:</strong> {value.whyItMatters}</p>
                {value.whatAffectsIt ? (
                  <p className="mt-2 text-sm leading-6 text-slate-600"><strong>What can affect it:</strong> {value.whatAffectsIt}</p>
                ) : null}
              </div>
            ))}
          </div>
        </Card>
      ))}

      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="size-5 text-blue-700" />
            <h2 className="font-syne text-xl font-bold text-slate-950">Questions to Ask Your Doctor</h2>
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(result.doctorQuestions.join("\n"))}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
          >
            <Copy className="size-3.5" />
            Copy
          </button>
        </div>
        <div className="space-y-3">
          {result.doctorQuestions.map((question, index) => (
            <div key={question} className="flex gap-3 rounded-2xl bg-slate-50 p-4">
              <div className="flex size-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                {index + 1}
              </div>
              <p className="text-sm leading-6 text-slate-700">{question}</p>
            </div>
          ))}
        </div>
      </Card>

      {result.isGuest ? (
        <Card className="bg-gradient-to-br from-blue-600 to-cyan-600 p-6 text-white">
          <div className="mb-3 flex items-center gap-2">
            <Save className="size-5" />
            <h3 className="font-syne text-xl font-bold">Save this report</h3>
          </div>
          <p className="mb-4 text-sm text-blue-50">Create a free account to keep your last 5 reports and unlock 10 analyses per day.</p>
          <div className="flex gap-3">
            <Link href="/auth/signup" className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-blue-700">Sign up free</Link>
            <Link href="/pricing" className="rounded-xl border border-white/40 px-4 py-2 text-sm font-semibold text-white">See plans</Link>
          </div>
        </Card>
      ) : null}

      <div className="text-center text-xs text-slate-500">{result.disclaimer}</div>
    </div>
  );
}
