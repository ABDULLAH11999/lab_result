import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { getRuntimeSettings } from "@/lib/runtime-config";
import { syncUserFromCheckoutSession } from "@/lib/stripe-billing";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { sessionId } = await request.json();
  if (!sessionId) {
    return NextResponse.json({ error: "Missing checkout session id." }, { status: 400 });
  }

  const stripe = getStripe(getRuntimeSettings().stripeMode);
  if (!stripe) {
    return NextResponse.json({ error: "Stripe is not configured yet." }, { status: 400 });
  }

  const synced = await syncUserFromCheckoutSession(stripe, sessionId);
  if (!synced || synced.user?.id !== session.id) {
    return NextResponse.json({ error: "Checkout session not found." }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    plan: synced.user.plan,
    subscriptionId: synced.user.stripeSubscriptionId || null
  });
}
