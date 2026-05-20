import { getUsage, writeUsage, getPlans } from "@/lib/db";

type UsageType = "analysis" | "doctor_chat";

function getLimit(tier: "guest" | "free" | "pro", usageType: UsageType) {
  if (usageType === "doctor_chat") {
    return tier === "guest" ? 3 : tier === "free" ? 5 : 999999;
  }

  const plans = getPlans<any>();
  const plan = plans.find((p) => p.id === tier);
  return plan ? plan.analysesLimit : tier === "guest" ? 3 : tier === "free" ? 10 : 1000;
}

export async function checkRateLimit(
  identifier: string,
  tier: "guest" | "free" | "pro" = "guest",
  usageType: UsageType = "analysis"
) {
  const limit = getLimit(tier, usageType);
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  const usage = getUsage<any>().filter(
    (entry) =>
      entry.identifier === identifier &&
      (entry.type || "analysis") === usageType &&
      new Date(entry.createdAt).getTime() >= cutoff
  );

  return {
    allowed: usage.length < limit,
    remaining: Math.max(limit - usage.length - 1, 0),
    resetAt: new Date(cutoff + 24 * 60 * 60 * 1000)
  };
}

export async function recordUsage(
  identifier: string,
  tier: "guest" | "free" | "pro",
  usageType: UsageType = "analysis"
) {
  const usage = getUsage<any>();
  usage.push({
    identifier,
    tier,
    type: usageType,
    createdAt: new Date().toISOString()
  });
  writeUsage(usage);
}
