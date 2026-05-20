import { getUsage, writeUsage } from "@/lib/db";

export async function checkRateLimit(identifier: string, tier: "guest" | "free" | "pro" = "guest") {
  const limit = tier === "guest" ? 3 : tier === "free" ? 10 : 1000;
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  const usage = getUsage<any>().filter(
    (entry) => entry.identifier === identifier && new Date(entry.createdAt).getTime() >= cutoff
  );

  return {
    allowed: usage.length < limit,
    remaining: Math.max(limit - usage.length - 1, 0),
    resetAt: new Date(cutoff + 24 * 60 * 60 * 1000)
  };
}

export async function recordUsage(identifier: string, tier: "guest" | "free" | "pro") {
  const usage = getUsage<any>();
  usage.push({
    identifier,
    tier,
    createdAt: new Date().toISOString()
  });
  writeUsage(usage);
}
