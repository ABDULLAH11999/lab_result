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
  { key: "Vitamins", name: "Vitamin & Mineral Levels", matches: ["vitamin d", "vitamin b12", "folate", "iron", "ferritin", "magnesium"] },
  { key: "Vitals", name: "Vitals", matches: ["blood pressure", "heart rate", "spo2", "oxygen", "temperature", "respiratory rate", "bmi", "weight", "height"] },
  { key: "Diagnostic Findings", name: "Diagnostic Findings", matches: ["electrocardiogram", "ecg", "ekg", "chest x-ray", "x-ray", "impression", "diagnosis", "assessment"] }
];

function normalizeRange(range?: string) {
  return range?.replace(/[â€“–—]/g, "-");
}

function detectStatus(line: string, value?: number, range?: string): ValueStatus {
  const lower = line.toLowerCase().replace(/prehypertension/g, "high").replace(/elevated/g, "high");
  if (lower.includes("critical low")) return "critical_low";
  if (lower.includes("critical high")) return "critical_high";
  if (lower.includes(" abnormal")) return "high";
  if (lower.includes(" low")) return "low";
  if (lower.includes(" high")) return "high";

  const normalizedRange = normalizeRange(range);
  if (value !== undefined && normalizedRange) {
    const match = normalizedRange.match(/(\d+(\.\d+)?)\s*-\s*(\d+(\.\d+)?)/);
    if (match) {
      const min = Number(match[1]);
      const max = Number(match[3]);
      if (value < min) return "low";
      if (value > max) return "high";
    }
  }

  return "normal";
}

function buildValue(input: {
  name: string;
  raw: string;
  number?: number;
  unit?: string;
  referenceRange?: string;
  status: ValueStatus;
  explanation?: string;
  whyItMatters?: string;
  whatAffectsIt?: string | null;
}): LabValue {
  return {
    name: input.name,
    raw: input.raw,
    number: input.number,
    unit: input.unit,
    referenceRange: input.referenceRange,
    status: input.status,
    explanation:
      input.explanation ||
      (input.status === "normal"
        ? `${input.name} appears to be within the usual range or is described as reassuring in the report.`
        : `${input.name} is flagged or described as needing follow-up, so it should be reviewed with your doctor in the context of the full report.`),
    whyItMatters:
      input.whyItMatters ||
      `${input.name} is one part of the overall clinical picture and is best interpreted alongside your symptoms, medical history, and the rest of the report.`,
    whatAffectsIt:
      input.whatAffectsIt === undefined
        ? input.status === "normal"
          ? null
          : "Results like this can change because of illness, medications, hydration, inflammation, stress, activity, or the reason the test was ordered."
        : input.whatAffectsIt
  };
}

function parseVitals(lines: string[]) {
  const values: LabValue[] = [];
  const vitalPatterns = [
    /^(Blood Pressure)\s+([0-9]{2,3}\/[0-9]{2,3}\s*mmHg)\s+(.+?)\s+(Normal|Prehypertension|High|Low)$/i,
    /^(Heart Rate)\s+([0-9]{2,3}\s*bpm)\s+(.+?)\s+(Normal|High|Low)$/i,
    /^(SpO2(?:\s*\(Oxygen\))?)\s+([0-9]{2,3}%.*)\s+(.+?)\s+(Normal|High|Low)$/i,
    /^(Temperature)\s+([0-9]{2}(?:\.[0-9])?°[CF].*)\s+(.+?)\s+(Normal|High|Low)$/i
  ];

  for (const line of lines) {
    for (const pattern of vitalPatterns) {
      const match = line.match(pattern);
      if (!match) continue;

      values.push(
        buildValue({
          name: match[1].trim(),
          raw: match[2].trim(),
          referenceRange: match[3].trim(),
          status: detectStatus(match[4], undefined, match[3].trim()),
          explanation:
            match[4].toLowerCase() === "normal"
              ? `${match[1].trim()} is listed in the expected range for this visit.`
              : `${match[1].trim()} is labeled outside the ideal range in this report and deserves follow-up in context with the rest of the visit.`,
          whyItMatters: `${match[1].trim()} helps describe how your body was functioning during this visit and can guide the clinician's interpretation of your symptoms.`
        })
      );
      break;
    }
  }

  return values;
}

function parseColonValues(lines: string[]) {
  const values: LabValue[] = [];

  for (const line of lines) {
    const match = line.match(/^([A-Za-z0-9\/ %()+-]+):\s*([^()]+?)(?:\s*\(Reference:\s*([^)]+)\))?(?:\s+(LOW|HIGH|CRITICAL LOW|CRITICAL HIGH))?$/i);
    if (!match) continue;

    const name = match[1].trim();
    const raw = match[2].replace(/\s+/g, " ").trim();
    const valueMatch = raw.match(/-?\d+(\.\d+)?/);
    const number = valueMatch ? Number(valueMatch[0]) : undefined;
    const unit = raw.replace(/^-?\d+(\.\d+)?\s*/, "").trim() || undefined;
    const referenceRange = match[3]?.trim();
    const status = detectStatus(line, number, referenceRange);

    values.push(
      buildValue({
        name,
        raw,
        number,
        unit,
        referenceRange,
        status
      })
    );
  }

  return values;
}

function parseNarrativeFindings(rawText: string) {
  const values: LabValue[] = [];
  const normalizedText = rawText.replace(/[â€“–—]/g, "-");
  const patterns = [
    { name: "Electrocardiogram (ECG/EKG)", regex: /Electrocardiogram\s*\(ECG\/EKG\):\s*(.+?)(?=\n|$)/i },
    { name: "Chest X-Ray", regex: /Chest X-Ray.*?:\s*(.+?)(?=\n|$)/i },
    { name: "Basic Metabolic Panel", regex: /Basic Metabolic Panel\s*\(BMP\):\s*(.+?)(?=\n|$)/i },
    { name: "Clinical Impression", regex: /Clinical Impression\s*&\s*Diagnosis\s*([\s\S]+?)(?=\n\s*\d+\.\s*Plan|\n\s*5\.\s*Plan|$)/i },
    { name: "Plan & Recommendations", regex: /Plan\s*&\s*Recommendations\s*([\s\S]+?)(?=Dr\.\s|Disclaimer:|$)/i }
  ];

  for (const pattern of patterns) {
    const match = normalizedText.match(pattern.regex);
    if (!match?.[1]) continue;

    const raw = match[1].replace(/\s+/g, " ").trim();
    values.push(
      buildValue({
        name: pattern.name,
        raw,
        status: detectStatus(raw),
        explanation: `${pattern.name} is described in the report narrative rather than as a standalone lab number.`,
        whyItMatters: `${pattern.name} helps explain the clinician's findings, interpretation, or follow-up plan from this report.`,
        whatAffectsIt: null
      })
    );
  }

  return values;
}

function fallbackAnalyze(rawText: string): AnalysisResult {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const combinedValues = [...parseVitals(lines), ...parseColonValues(lines), ...parseNarrativeFindings(rawText)];
  const dedupedMap = new Map<string, LabValue>();
  for (const value of combinedValues) {
    const key = `${value.name.toLowerCase()}::${value.raw.toLowerCase()}`;
    if (!dedupedMap.has(key)) {
      dedupedMap.set(key, value);
    }
  }
  const values = [...dedupedMap.values()];

  const grouped = panelMatchers
    .map((panel) => {
      const panelValues = values.filter((value) =>
        panel.matches.some((term) => value.name.toLowerCase().includes(term))
      );
      return panelValues.length ? { name: panel.name, abbreviation: panel.key, values: panelValues } : null;
    })
    .filter(Boolean) as Array<{ name: string; abbreviation: string; values: LabValue[] }>;

  const usedNames = new Set(grouped.flatMap((panel) => panel.values.map((value) => `${value.name}::${value.raw}`)));
  const otherValues = values.filter((value) => !usedNames.has(`${value.name}::${value.raw}`));
  if (otherValues.length) {
    grouped.push({ name: "Other", abbreviation: "Other", values: otherValues });
  }

  const abnormalCount = values.filter((value) => value.status !== "normal").length;
  const concernLevel = abnormalCount === 0 ? "normal" : abnormalCount <= 2 ? "watch" : "concern";

  return {
    overallSummary:
      values.length > 0
        ? `We identified ${values.length} measurable value${values.length === 1 ? "" : "s"} or named finding${values.length === 1 ? "" : "s"} in your report. ${abnormalCount === 0 ? "Most extracted items do not appear clearly flagged, but your doctor should still review the full report in context." : `${abnormalCount} item${abnormalCount === 1 ? " is" : "s are"} flagged or outside the usual range, so it is worth reviewing the full pattern with your doctor.`}`
        : "We could not clearly parse the main findings in this uploaded report. Please try uploading again or paste the text directly.",
    concernLevel,
    concernScore: Math.min(abnormalCount * 18, 80),
    panels: grouped,
    allValues: values,
    doctorQuestions: [
      "Which findings matter most for my symptoms and medical history?",
      "Are any of these measurements or findings related to each other?",
      "Should any labs, vitals, imaging, or follow-up tests be repeated over time?"
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
