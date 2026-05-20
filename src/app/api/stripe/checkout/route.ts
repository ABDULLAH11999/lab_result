import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getStripe, getStripeClientConfig } from "@/lib/stripe";
import { getRuntimeSettings } from "@/lib/runtime-config";

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const runtime = getRuntimeSettings();
  const stripe = getStripe(runtime.stripeMode);
  const config = getStripeClientConfig(runtime.stripeMode);
  if (!stripe || !config.priceId) {
    return NextResponse.json({ error: "Stripe is not configured yet." }, { status: 400 });
  }

  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: config.priceId, quantity: 1 }],
    customer_email: session.email,
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    metadata: { userId: session.id, stripeMode: runtime.stripeMode }
  });

  return NextResponse.json({ url: checkout.url });
}
