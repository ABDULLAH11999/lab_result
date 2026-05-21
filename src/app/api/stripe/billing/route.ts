import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { findUserById, getBillingSummary } from "@/lib/stripe-billing";
import { getStripe, getStripeClientConfig } from "@/lib/stripe";
import { getRuntimeSettings } from "@/lib/runtime-config";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const runtime = getRuntimeSettings();
  const user = findUserById(session.id);
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const stripe = getStripe(runtime.stripeMode);
  const config = getStripeClientConfig(runtime.stripeMode);
  const billing = await getBillingSummary(stripe, user);

  return NextResponse.json({
    billing,
    stripe: {
      publishableKey: config.publishableKey || "",
      mode: runtime.stripeMode
    }
  });
}
