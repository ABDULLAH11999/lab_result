export type PlanId = "guest" | "free" | "pro" | string;

export type PlanRecord = {
  id: PlanId;
  name?: string;
  price?: number | string;
  isPaid?: boolean;
  isVisible?: boolean;
  analysesLimit?: number;
  features?: string[];
  cta?: string;
  href?: string;
};

export const publicPlanCatalog: Required<Pick<PlanRecord, "id" | "name" | "price" | "isPaid" | "isVisible" | "analysesLimit" | "features" | "cta" | "href">>[] = [
  {
    id: "guest",
    name: "Guest",
    price: 0,
    isPaid: false,
    isVisible: true,
    analysesLimit: 3,
    features: ["3 analyses/day", "Full report explanation", "Doctor question list"],
    cta: "Start free",
    href: "/analyze"
  },
  {
    id: "free",
    name: "Free",
    price: 0,
    isPaid: false,
    isVisible: true,
    analysesLimit: 10,
    features: ["10 analyses/day", "Save last 5 reports", "Basic history"],
    cta: "Create account",
    href: "/auth/signup"
  },
  {
    id: "pro",
    name: "Pro",
    price: 9,
    isPaid: true,
    isVisible: true,
    analysesLimit: 999999,
    features: ["Unlimited analyses", "Full history", "Trend comparison", "PDF export"],
    cta: "Go Pro",
    href: "/auth/signup?plan=pro"
  }
];

const defaultPlans = Object.fromEntries(publicPlanCatalog.map((plan) => [plan.id, plan]));

export function normalizePlan(plan: PlanRecord): Required<Pick<PlanRecord, "id" | "name" | "price" | "isPaid" | "isVisible" | "analysesLimit" | "features" | "cta" | "href">> {
  const fallback = defaultPlans[plan.id] || {
    id: plan.id,
    name: plan.name || plan.id,
    price: typeof plan.price === "string" ? plan.price : Number(plan.price || 0),
    isPaid: Boolean(plan.isPaid),
    isVisible: true,
    analysesLimit: Number(plan.analysesLimit || 0),
    features: [],
    cta: "Choose plan",
    href: "/auth/signup"
  };

  return {
    ...fallback,
    ...plan,
    isVisible: plan.isVisible !== false,
    features: Array.isArray(plan.features) ? plan.features : fallback.features,
    cta: plan.cta || fallback.cta,
    href: plan.href || fallback.href
  };
}

export function normalizePlans(plans: PlanRecord[]) {
  return plans.map((plan) => normalizePlan(plan));
}
