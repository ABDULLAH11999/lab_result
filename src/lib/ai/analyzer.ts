import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { MEDICAL_DISCLAIMER } from "@/lib/constants";
import { normalizeAnalysis } from "@/lib/ai/parser";
import { ANALYSIS_SYSTEM_PROMPT, ANALYSIS_USER_PROMPT } from "@/lib/ai/prompts";
import type { AnalysisResult, LabValue, ValueStatus } from "@/types";

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;
const gemini = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

const panelMatchers = [
  { key: "CBC", name: "Complete Blood Count", matches: ["wbc", "rbc", "hemoglobin", "hematocrit", "mcv", "mch", "mchc", "platelet"] },
  { key: "CMP", name: "Comprehensive Metabolic Panel", matches: ["glucose", "bun", "creatinine", "egfr", "sodium", "potassium", "alt", "ast", "bilirubin", "albumin"] },
  { key: "Lipid Panel", name: "Lipid Panel", matches: ["cholesterol", "ldl", "hdl", "triglycerides", "non-hdl"] },
  { key: "Thyroid", name: "Thyroid", matches: ["tsh", "t4", "t3"] },
  { key: "Diabetes", name: "Diabetes", matches: ["hba1c", "a1c", "insulin"] },
  { key: "Vitamins", name: "Vitamin & Mineral Levels", matches: ["vitamin d", "vitamin b12", "folate", "iron", "ferritin", "magnesium"] }
];

function detectStatus(line: string, value?: number, range?: string): ValueStatus {
  const lower = line.toLowerCase();
  if (lower.includes("critical low")) return "critical_low";
  if (lower.includes("critical high")) return "critical_high";
  if (lower.includes(" low")) return "low";
  if (lower.includes(" high")) return "high";

  if (value !== undefined && range) {
    const match = range.match(/(\d+(\.\d+)?)\s*[-–]\s*(\d+(\.\d+)?)/);
    if (match) {
      const min = Number(match[1]);
      const max = Number(match[3]);
      if (value < min) return "low";
      if (value > max) return "high";
    }
  }

  return "normal";
}

function fallbackAnalyze(rawText: string): AnalysisResult {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const values: LabValue[] = [];

  for (const line of lines) {
    const match = line.match(/^([A-Za-z0-9\/ %+-]+):\s*([^()]+?)(?:\s*\(Reference:\s*([^)]+)\))?(?:\s+(LOW|HIGH|CRITICAL LOW|CRITICAL HIGH))?$/i);
    if (!match) continue;

    const name = match[1].trim();
    const raw = match[2].trim();
    const valueMatch = raw.match(/-?\d+(\.\d+)?/);
    const number = valueMatch ? Number(valueMatch[0]) : undefined;
    const unit = raw.replace(/^-?\d+(\.\d+)?\s*/, "").trim() || undefined;
    const referenceRange = match[3]?.trim();
    const status = detectStatus(line, number, referenceRange);

    values.push({
      name,
      raw,
      number,
      unit,
      referenceRange,
      status,
      explanation:
        status === "normal"
          ? `${name} appears to be within the reference range shown on your report.`
          : `${name} is flagged on your report and should be reviewed with your doctor in context with the rest of your labs.`,
      whyItMatters: `${name} is one part of the overall lab picture and is best interpreted alongside your symptoms, medications, and the rest of the panel.`,
      whatAffectsIt:
        status === "normal" ? null : "Lab values can change because of health conditions, medications, hydration, diet, recent illness, exercise, or lab-specific differences."
    });
  }

  const grouped = panelMatchers.map((panel) => {
    const panelValues = values.filter((value) =>
      panel.matches.some((term) => value.name.toLowerCase().includes(term))
    );
    return panelValues.length
      ? { name: panel.name, abbreviation: panel.key, values: panelValues }
      : null;
  }).filter(Boolean) as any[];

  const usedNames = new Set(grouped.flatMap((panel) => panel.values.map((value: LabValue) => value.name)));
  const otherValues = values.filter((value) => !usedNames.has(value.name));
  if (otherValues.length) {
    grouped.push({ name: "Other", abbreviation: "Other", values: otherValues });
  }

  const abnormalCount = values.filter((value) => value.status !== "normal").length;
  const concernLevel = abnormalCount === 0 ? "normal" : abnormalCount <= 2 ? "watch" : "concern";

  return {
    overallSummary:
      values.length > 0
        ? `We identified ${values.length} lab value${values.length === 1 ? "" : "s"} in your report. ${abnormalCount === 0 ? "Nothing appears flagged in the pasted text, but your doctor should still review the full report in context." : `${abnormalCount} value${abnormalCount === 1 ? " is" : "s are"} outside the range or flagged, so it is worth reviewing the full pattern with your doctor.`}`
        : "We could not clearly parse the values in the pasted text. Please try pasting the lab section again.",
    concernLevel,
    concernScore: Math.min(abnormalCount * 18, 80),
    panels: grouped,
    allValues: values,
    doctorQuestions: [
      "Which results matter most for my age, symptoms, and medical history?",
      "Are any of these abnormal values related to each other?",
      "Should any of these labs be repeated or followed over time?"
    ],
    detectedPanels: grouped.map((panel) => panel.abbreviation),
    labSource: rawText.toLowerCase().includes("quest")
      ? "Quest"
      : rawText.toLowerCase().includes("labcorp")
        ? "Labcorp"
        : rawText.toLowerCase().includes("hospital")
          ? "Hospital"
          : "Unknown",
    reportDate: rawText.match(/\b(20\d{2}-\d{2}-\d{2})\b/)?.[1] || null,
    disclaimer: MEDICAL_DISCLAIMER
  };
}

async function analyzeWithGroq(rawText: string) {
  if (!groq) throw new Error("Groq not configured");
  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.1,
    max_tokens: 4000,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: ANALYSIS_SYSTEM_PROMPT },
      { role: "user", content: ANALYSIS_USER_PROMPT(rawText) }
    ]
  });

  const raw = response.choices[0]?.message?.content || "{}";
  return normalizeAnalysis(JSON.parse(raw));
}

async function analyzeWithGemini(rawText: string) {
  if (!gemini) throw new Error("Gemini not configured");
  const model = gemini.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 4000,
      responseMimeType: "application/json"
    }
  });

  const result = await model.generateContent(`${ANALYSIS_SYSTEM_PROMPT}\n\n${ANALYSIS_USER_PROMPT(rawText)}`);
  return normalizeAnalysis(JSON.parse(result.response.text().replace(/```json|```/g, "").trim()));
}

export async function analyzeLabResults(rawText: string): Promise<AnalysisResult> {
  if (!rawText || rawText.trim().length < 20) {
    throw new Error("Please paste your lab results. The text appears too short.");
  }

  if (rawText.length > 15000) {
    throw new Error("The pasted text is too long. Please paste only the lab section.");
  }

  try {
    return await analyzeWithGroq(rawText);
  } catch {
    try {
      return await analyzeWithGemini(rawText);
    } catch {
      return fallbackAnalyze(rawText);
    }
  }
}
