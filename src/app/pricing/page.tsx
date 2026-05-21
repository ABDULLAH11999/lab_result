import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { getSettings } from "@/lib/db";
import { normalizeBaseUrl } from "@/lib/seo";
import UpgradeButton from "@/components/billing/UpgradeButton";

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = normalizeBaseUrl(getSettings<any>()?.canonicalUrl);
  return {
    title: "Free Medical Report Overview & Pro Lab Tracking Pricing",
    description: "Start with free lab report analysis, medical report summaries, and blood test explanations. Upgrade for unlimited reports, history, trends, and PDF export.",
    alternates: {
      canonical: `${baseUrl}/pricing`
    }
  };
}

const plans = [
  { name: "Guest", price: "$0", cta: "Start free", href: "/analyze", features: ["3 analyses/day", "Full report explanation", "Doctor question list"] },
  { name: "Free", price: "$0", cta: "Create account", href: "/auth/signup", features: ["10 analyses/day", "Save last 5 reports", "Basic history"] },
  { name: "Pro", price: "$9/mo", cta: "Go Pro", href: "/auth/signup?plan=pro", features: ["Unlimited analyses", "Full history", "Trend comparison", "PDF export"] }
];

export default async function PricingPage() {
  const session = await getSession();

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <h1 className="font-syne text-4xl font-bold text-slate-950">Simple pricing</h1>
        <p className="mt-3 text-slate-600">Start free, then upgrade when you want history, trends, and export.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <div key={plan.name} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-syne text-2xl font-bold text-slate-950">{plan.name}</h2>
            <p className="mt-3 text-4xl font-extrabold text-slate-950">{plan.price}</p>
            <div className="mt-6 space-y-3">
              {plan.features.map((feature) => (
                <div key={feature} className="flex gap-3 text-sm text-slate-700">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
            {plan.name === "Pro" ? (
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
