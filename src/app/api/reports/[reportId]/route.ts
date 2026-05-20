import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getReports, writeReports } from "@/lib/db";
import { MEDICAL_DISCLAIMER } from "@/lib/constants";

export async function GET(_: NextRequest, { params }: { params: Promise<{ reportId: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { reportId } = await params;
  const report = getReports<any>().find((entry) => entry.id === reportId && entry.userId === session.id);
  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  return NextResponse.json({
    report: {
      reportId: report.id,
      overallSummary: report.overallSummary,
      concernLevel: report.concernLevel,
      concernScore: report.concernScore,
      panels: report.panels || [],
      allValues: report.valuesAnalyzed,
      doctorQuestions: report.doctorQuestions,
      detectedPanels: report.panelTypes,
      labSource: report.labSource,
      reportDate: report.reportDate,
      disclaimer: MEDICAL_DISCLAIMER
    }
  });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ reportId: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { reportId } = await params;
  const reports = getReports<any>();
  writeReports(reports.filter((report) => !(report.id === reportId && report.userId === session.id)));
  return NextResponse.json({ success: true });
}
