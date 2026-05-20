import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getPayments, getUsers, writePayments, writeUsers } from "@/lib/db";
import { getRuntimeSettings } from "@/lib/runtime-config";

export async function POST(request: NextRequest) {
  const runtime = getRuntimeSettings();
  const stripe = getStripe(runtime.stripeMode);
  const webhookSecret =
    runtime.stripeMode === "live"
      ? process.env.STRIPE_WEBHOOK_SECRET || process.env.STRIPE_TEST_WEBHOOK_SECRET
      : process.env.STRIPE_TEST_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !webhookSecret) {
    return NextResponse.json({ received: false, reason: "Stripe not configured" }, { status: 400 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  const payments = getPayments<any>();
  payments.push({ id: event.id, type: event.type, createdAt: new Date().toISOString() });
  writePayments(payments);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    const users = getUsers<any>();
    const user = users.find((entry) => entry.id === session.metadata?.userId);
    if (user) {
      user.plan = "pro";
      user.analysesLimit = 999999;
      user.stripeSubscriptionId = session.subscription;
      user.stripeCustomerId = session.customer;
      writeUsers(users);
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as any;
    const users = getUsers<any>();
    const user = users.find((entry) => entry.stripeSubscriptionId === subscription.id);
    if (user) {
      user.plan = "free";
      user.analysesLimit = 10;
      writeUsers(users);
    }
  }

  return NextResponse.json({ received: true });
}
