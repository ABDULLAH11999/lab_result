import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getStripe, getStripeClientConfig } from "@/lib/stripe";
import { getRuntimeSettings } from "@/lib/runtime-config";
import { findUserById, getOrCreateStripeCustomer, syncUserFromSubscription } from "@/lib/stripe-billing";
import { getSettings } from "@/lib/db";
import { normalizeBaseUrl } from "@/lib/seo";

export async function POST() {
  try {
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

    const user = findUserById(session.id);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const synced = await syncUserFromSubscription(stripe, user.id);
    if (synced?.subscription && ["active", "trialing", "past_due", "unpaid"].includes(synced.subscription.status)) {
      return NextResponse.json({ url: `${normalizeBaseUrl(getSettings<any>()?.canonicalUrl)}/dashboard?billing=already-active` });
    }

    const customer = await getOrCreateStripeCustomer(stripe, user);
    const baseUrl = normalizeBaseUrl(getSettings<any>()?.canonicalUrl);
    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: config.priceId, quantity: 1 }],
      customer: customer.id,
      success_url: `${baseUrl}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing?checkout=cancelled`,
      metadata: { userId: session.id, stripeMode: runtime.stripeMode },
      subscription_data: {
        metadata: { userId: session.id, stripeMode: runtime.stripeMode }
      }
    });

    return NextResponse.json({ url: checkout.url });
  } catch (error) {
    console.error("Stripe checkout route failed:", error);
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Stripe checkout could not be started.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
