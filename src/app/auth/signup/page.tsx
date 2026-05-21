import SignupForm from "@/components/auth/SignupForm";

export default async function SignupPage({
  searchParams
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const params = await searchParams;
  const initialPlan = params.plan === "pro" ? "pro" : "free";

  return <SignupForm initialPlan={initialPlan} />;
}
