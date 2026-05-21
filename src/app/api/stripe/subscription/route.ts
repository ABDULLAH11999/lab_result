import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { getRuntimeSettings } from "@/lib/runtime-config";
import { findUserById, syncUserFromSubscription } from "@/lib/stripe-billing";
import { getUsers, writeUsers } from "@/lib/db";

export async function DELETE() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const stripe = getStripe(getRuntimeSettings().stripeMode);
  if (!stripe) {
    return NextResponse.json({ error: "Stripe is not configured yet." }, { status: 400 });
  }

  const user = findUserById(session.id);
  if (!user || !user.stripeSubscriptionId) {
    return NextResponse.json({ error: "No active subscription was found." }, { status: 404 });
  }

  await stripe.subscriptions.cancel(user.stripeSubscriptionId);

  if (user.stripeCustomerId) {
    const customer = await stripe.customers.retrieve(user.stripeCustomerId, {
      expand: ["invoice_settings.default_payment_method"]
    });

    if (!("deleted" in customer) || !customer.deleted) {
      const defaultPaymentMethodId =
        typeof customer.invoice_settings.default_payment_method === "string"
          ? customer.invoice_settings.default_payment_method
          : customer.invoice_settings.default_payment_method?.id;

      await stripe.customers.update(customer.id, {
        invoice_settings: {
          default_payment_method: null as unknown as string
        }
      });

      if (defaultPaymentMethodId) {
        try {
          await stripe.paymentMethods.detach(defaultPaymentMethodId);
        } catch {
          // Ignore detach failures after cancellation.
        }
      }
    }
  }

  const users = getUsers<any>();
  const storedUser = users.find((entry) => entry.id === session.id);
  if (storedUser) {
    storedUser.plan = "free";
    storedUser.analysesLimit = 10;
    storedUser.stripeSubscriptionId = null;
    storedUser.subscriptionStatus = "canceled";
    storedUser.subscriptionCancelAtPeriodEnd = false;
    storedUser.subscriptionCurrentPeriodEnd = null;
    storedUser.stripePaymentMethodId = null;
    writeUsers(users);
  }

  await syncUserFromSubscription(stripe, session.id);
  return NextResponse.json({ success: true });
}
