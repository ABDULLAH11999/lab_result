import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getPayments, getUsers, writePayments, writeUsers } from "@/lib/db";
import { getRuntimeSettings } from "@/lib/runtime-config";
import { sendPurchaseConfirmationUser, sendPurchaseNotificationAdmin } from "@/lib/mail";
import { syncUserFromCheckoutSession, syncUserFromSubscription } from "@/lib/stripe-billing";

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
    const synced = await syncUserFromCheckoutSession(stripe, session.id);
    const user = synced?.user;
    if (user) {
      // Trigger purchase success emails
      try {
        await sendPurchaseConfirmationUser(user.email, "Pro");
        await sendPurchaseNotificationAdmin(user.email, "Pro");
      } catch (err) {
        console.error("Failed to send purchase emails:", err);
      }
    }
  }

  if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as any;
    const users = getUsers<any>();
    const user = users.find((entry) => entry.stripeSubscriptionId === subscription.id || entry.stripeCustomerId === subscription.customer);
    if (user) {
      await syncUserFromSubscription(stripe, user.id);
    }
  }

  return NextResponse.json({ received: true });
}
