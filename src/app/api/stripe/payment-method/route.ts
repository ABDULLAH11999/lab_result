import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { findUserById, getOrCreateStripeCustomer, syncUserFromSubscription } from "@/lib/stripe-billing";
import { getStripe } from "@/lib/stripe";
import { getRuntimeSettings } from "@/lib/runtime-config";
import { getUsers, writeUsers } from "@/lib/db";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { paymentMethodId } = await request.json();
  if (!paymentMethodId) {
    return NextResponse.json({ error: "Missing payment method." }, { status: 400 });
  }

  const runtime = getRuntimeSettings();
  const stripe = getStripe(runtime.stripeMode);
  if (!stripe) {
    return NextResponse.json({ error: "Stripe is not configured yet." }, { status: 400 });
  }

  const user = findUserById(session.id);
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const customer = await getOrCreateStripeCustomer(stripe, user);
  const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
  if (paymentMethod.type !== "card" || !paymentMethod.card) {
    return NextResponse.json({ error: "Only card payment methods are supported." }, { status: 400 });
  }

  if (runtime.stripeMode === "test" && paymentMethod.card.last4 !== "4242") {
    try {
      await stripe.paymentMethods.detach(paymentMethod.id);
    } catch {
      // Best effort cleanup in test mode.
    }
    return NextResponse.json({ error: "Test mode only allows the Stripe 4242 test card." }, { status: 400 });
  }

  if (paymentMethod.customer !== customer.id) {
    await stripe.paymentMethods.attach(paymentMethod.id, { customer: customer.id });
  }

  await stripe.customers.update(customer.id, {
    invoice_settings: {
      default_payment_method: paymentMethod.id
    }
  });

  if (user.stripeSubscriptionId) {
    await stripe.subscriptions.update(user.stripeSubscriptionId, {
      default_payment_method: paymentMethod.id
    });
  }

  const users = getUsers<any>();
  const storedUser = users.find((entry) => entry.id === session.id);
  if (storedUser) {
    storedUser.stripePaymentMethodId = paymentMethod.id;
    writeUsers(users);
  }

  await syncUserFromSubscription(stripe, session.id);
  return NextResponse.json({ success: true });
}
