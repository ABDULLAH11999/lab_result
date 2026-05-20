import { NextRequest, NextResponse } from "next/server";
import { analyzeLabResults } from "@/lib/ai/analyzer";
import { getSession } from "@/lib/auth";
import { checkRateLimit, recordUsage } from "@/lib/rate-limit";
import { getReports, writeReports } from "@/lib/db";
import { uid } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const { rawText } = await request.json();
  if (!rawText?.trim()) {
    return NextResponse.json({ error: "Please paste your lab results." }, { status: 400 });
  }

  const session = await getSession();
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const tier = session ? session.plan : "guest";
  const identifier = session?.id || ip;
  const limiterTier = tier === "pro" ? "pro" : tier === "free" ? "free" : "guest";
  const rate = await checkRateLimit(identifier, limiterTier);

  if (!rate.allowed) {
    return NextResponse.json(
      {
        error: "Daily limit reached.",
        message: session ? "Upgrade to Pro for unlimited analyses." : "Create a free account for 10 analyses per day.",
        upgradeRequired: true
      },
      { status: 429 }
    );
  }

  try {
    const result = await analyzeLabResults(rawText);
    let reportId: string | undefined;
    await recordUsage(identifier, limiterTier);

    if (session) {
      reportId = uid("report");
      const reports = getReports<any>();
      reports.push({
        id: reportId,
        userId: session.id,
        identifier,
        reportName: `${result.detectedPanels[0] || "Lab"} Report`,
        rawInput: rawText,
        overallSummary: result.overallSummary,
        concernLevel: result.concernLevel,
        concernScore: result.concernScore,
        doctorQuestions: result.doctorQuestions,
        panels: result.panels,
        valuesAnalyzed: result.allValues,
        panelTypes: result.detectedPanels,
        labSource: result.labSource,
        reportDate: result.reportDate || null,
        createdAt: new Date().toISOString()
      });
      writeReports(reports);
      result.reportId = reportId;
    }

    return NextResponse.json({
      ...result,
      reportId,
      analysesRemaining: rate.remaining,
      isGuest: !session
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Analysis failed." }, { status: 500 });
  }
}
