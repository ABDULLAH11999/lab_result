import SignupForm from "@/components/auth/SignupForm";
import { getPlans } from "@/lib/db";
import type { Plan } from "@/types";

export default async function RegisterPage({
  searchParams
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const params = await searchParams;
  const availablePlans = (await getPlans<any>())
    .filter((plan) => plan.isVisible !== false)
    .map((plan) => plan.id)
    .filter((plan): plan is Plan => plan === "free" || plan === "pro");
  const visiblePlans: Plan[] = availablePlans.length ? availablePlans : (["free", "pro"] as Plan[]);
  const initialPlan = params.plan === "pro" && visiblePlans.includes("pro") ? "pro" : (visiblePlans[0] || "free");

  return <SignupForm initialPlan={initialPlan} availablePlans={visiblePlans} />;
}
