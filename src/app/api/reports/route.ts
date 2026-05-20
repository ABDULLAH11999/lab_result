import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getReports } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ reports: [] }, { status: 401 });
  }

  const reports = getReports<any>()
    .filter((report) => report.userId === session.id)
    .map((report) => ({
      id: report.id,
      reportName: report.reportName,
      reportDate: report.reportDate,
      concernLevel: report.concernLevel,
      concernScore: report.concernScore,
      panelTypes: report.panelTypes,
      createdAt: report.createdAt
    }));

  return NextResponse.json({ reports });
}
