import { MEDICAL_DISCLAIMER } from "@/lib/constants";
import type { AnalysisResult } from "@/types";

export function normalizeAnalysis(raw: any): AnalysisResult {
  const panels = Array.isArray(raw?.panels) ? raw.panels : [];
  const allValues = panels.flatMap((panel: any) => panel.values || []);

  return {
    overallSummary:
      raw?.overallSummary ||
      "Your report was parsed, but the explanation was incomplete. Please review the values with your doctor.",
    concernLevel: raw?.concernLevel || "watch",
    concernScore: Number(raw?.concernScore || 0),
    panels,
    allValues,
    doctorQuestions: Array.isArray(raw?.doctorQuestions) ? raw.doctorQuestions : [],
    detectedPanels: Array.isArray(raw?.detectedPanels)
      ? raw.detectedPanels
      : panels.map((panel: any) => panel.abbreviation).filter(Boolean),
    labSource: raw?.labSource || "Unknown",
    reportDate: raw?.reportDate || null,
    disclaimer: MEDICAL_DISCLAIMER
  };
}
