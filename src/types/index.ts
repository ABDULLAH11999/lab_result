export type Plan = "free" | "pro";
export type ConcernLevel = "normal" | "watch" | "concern" | "urgent";
export type ValueStatus = "normal" | "low" | "high" | "critical_low" | "critical_high";

export interface LabValue {
  name: string;
  raw: string;
  number?: number;
  unit?: string;
  referenceRange?: string;
  status: ValueStatus;
  explanation: string;
  whyItMatters: string;
  whatAffectsIt?: string | null;
}

export interface LabPanel {
  name: string;
  abbreviation: string;
  values: LabValue[];
}

export interface AnalysisResult {
  reportId?: string;
  overallSummary: string;
  concernLevel: ConcernLevel;
  concernScore: number;
  panels: LabPanel[];
  allValues: LabValue[];
  doctorQuestions: string[];
  detectedPanels: string[];
  labSource?: string;
  reportDate?: string | null;
  disclaimer: string;
  isGuest?: boolean;
  analysesRemaining?: number;
}

export interface SavedReport {
  id: string;
  userId: string;
  reportName: string;
  reportDate?: string | null;
  concernLevel: ConcernLevel;
  concernScore: number;
  panelTypes: string[];
  createdAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  password: string;
  role?: "superadmin" | "user";
  plan: Plan;
  analysesToday: number;
  analysesLimit: number;
  createdAt: string;
  verifiedAt?: string;
}

export interface SessionUser {
  id: string;
  email: string;
  fullName?: string;
  role?: "superadmin" | "user";
  plan: Plan;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  cover?: string;
  keywords: string[];
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  publishedAt: string;
  content: string;
}
