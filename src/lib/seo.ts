export const DEFAULT_SITE_TITLE =
  "Free Lab Report Analyzer & Medical Report Summary Tool | Upload PDF or Scan | LabExplain";

export const DEFAULT_SITE_DESCRIPTION =
  "Upload a PDF, scan a paper report, or paste your lab results to get a free lab report summary, medical report explanation, blood test overview, and clear doctor questions in plain English.";

export const DEFAULT_SITE_KEYWORDS = [
  "lab report summary",
  "lab report analyzer",
  "report analyzer",
  "free lab report analyzer",
  "free lab report explain",
  "lab report explain free",
  "medical report explanation",
  "medical report analyzer",
  "medical report explainer",
  "medical report summary tool",
  "free report overview",
  "medical report overview free",
  "free medical report analyzer",
  "get free report explanation",
  "get free report explaination",
  "free medical report explanation",
  "free medical report summary",
  "blood test report explanation",
  "blood test analyzer free",
  "lab results explained",
  "blood test results explained",
  "lab results summary tool",
  "free lab results summary",
  "scan analyze report",
  "scan analyze medical report free",
  "scan medical report online free",
  "upload medical report analyzer",
  "upload lab report analyzer",
  "PDF lab report analyzer",
  "upload PDF lab report",
  "scan lab report with camera",
  "CBC blood test explained",
  "CMP blood test explained",
  "cholesterol report analyzer",
  "thyroid lab report explanation",
  "HbA1c report explanation",
  "Quest lab results explained",
  "Labcorp results explained",
  "doctor questions for lab results",
  "plain English lab results",
  "medical report overview",
  "health report analyzer",
  "AI lab report explanation",
  "free lab results checker",
  "scan blood test report",
  "medical test report explanation",
  "understand lab report online",
  "free blood report analysis",
  "free report interpretation tool",
  "analyze health report online",
  "lab explain",
  "labexplain"
];

export function normalizeBaseUrl(value?: string) {
  return (value || process.env.NEXT_PUBLIC_APP_URL || "https://labexplain.online").replace(/\/$/, "");
}

export function getSiteKeywords(settings?: { siteKeywords?: string[] | string }) {
  if (Array.isArray(settings?.siteKeywords)) {
    return settings.siteKeywords.filter(Boolean);
  }

  if (typeof settings?.siteKeywords === "string") {
    return settings.siteKeywords
      .split(",")
      .map((keyword) => keyword.trim())
      .filter(Boolean);
  }

  return DEFAULT_SITE_KEYWORDS;
}
