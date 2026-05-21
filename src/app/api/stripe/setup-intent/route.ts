import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { findUserById, getOrCreateStripeCustomer } from "@/lib/stripe-billing";
import { getStripe } from "@/lib/stripe";
import { getRuntimeSettings } from "@/lib/runtime-config";

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const stripe = getStripe(getRuntimeSettings().stripeMode);
  if (!stripe) {
    return NextResponse.json({ error: "Stripe is not configured yet." }, { status: 400 });
  }

  const user = findUserById(session.id);
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const customer = await getOrCreateStripeCustomer(stripe, user);
  const setupIntent = await stripe.setupIntents.create({
    customer: customer.id,
    payment_method_types: ["card"],
    usage: "off_session",
    metadata: {
      userId: user.id,
      stripeMode: getRuntimeSettings().stripeMode
    }
  });

  return NextResponse.json({ clientSecret: setupIntent.client_secret });
}
