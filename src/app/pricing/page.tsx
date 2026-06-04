import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { getPlans, getSettings } from "@/lib/db";
import { normalizeBaseUrl } from "@/lib/seo";
import { normalizePlans, publicPlanCatalog } from "@/lib/plans";
import UpgradeButton from "@/components/billing/UpgradeButton";

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = normalizeBaseUrl((await getSettings<any>())?.canonicalUrl);
  return {
    title: "Free Medical Report Overview & Pro Lab Tracking Pricing",
    description: "Start with free lab report analysis, medical report summaries, and blood test explanations. Upgrade for unlimited reports, history, trends, and PDF export.",
    alternates: {
      canonical: `${baseUrl}/pricing`
    }
  };
}

function formatPrice(plan: any) {
  if (typeof plan.price === "string") {
    return plan.price;
  }
  if (plan.price === 0) {
    return "$0";
  }
  return plan.isPaid === false ? `$${plan.price}` : `$${plan.price}/mo`;
}

export default async function PricingPage() {
  const session = await getSession();
  const plans = normalizePlans(await getPlans<any>()).filter((plan) => plan.isVisible !== false);
  const visiblePlans = plans.length ? plans : publicPlanCatalog;

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <h1 className="font-syne text-4xl font-bold text-slate-950">Simple pricing</h1>
        <p className="mt-3 text-slate-600">Start free, then upgrade when you want history, trends, and export.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {visiblePlans.map((plan) => (
          <div key={plan.id || plan.name} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-syne text-2xl font-bold text-slate-950">{plan.name}</h2>
            <p className="mt-3 text-4xl font-extrabold text-slate-950">{formatPrice(plan)}</p>
            <div className="mt-6 space-y-3">
              {plan.features.map((feature: string) => (
                <div key={feature} className="flex gap-3 text-sm text-slate-700">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
            {plan.id === "pro" ? (
              <UpgradeButton
                authenticated={Boolean(session)}
                className="mt-8 inline-flex w-full justify-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white"
              >
                {plan.cta}
              </UpgradeButton>
            ) : (
              <Link href={plan.href} className="mt-8 inline-flex w-full justify-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white">
                {plan.cta}
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
