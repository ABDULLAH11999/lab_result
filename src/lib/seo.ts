export const DEFAULT_SITE_TITLE =
  "Free Medical Report Analyzer | Lab Report Summary & Explanation | LabExplain";

export const DEFAULT_SITE_DESCRIPTION =
  "Scan, upload, or paste your lab report for a free medical report overview. LabExplain gives plain-English lab report summaries, blood test explanations, and doctor questions.";

export const DEFAULT_SITE_KEYWORDS = [
  "lab report summary",
  "lab report analyzer",
  "report analyzer",
  "medical report explanation",
  "medical report analyzer",
  "free report overview",
  "medical report overview free",
  "free medical report analyzer",
  "get free report explanation",
  "get free report explaination",
  "blood test report explanation",
  "blood test analyzer free",
  "lab results explained",
  "blood test results explained",
  "scan analyze report",
  "scan analyze medical report free",
  "upload lab report analyzer",
  "PDF lab report analyzer",
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
  "scan blood test report"
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
