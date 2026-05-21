import type Stripe from "stripe";
import { getUsers, writeUsers } from "@/lib/db";
import { getRuntimeSettings } from "@/lib/runtime-config";

const ACTIVE_SUBSCRIPTION_STATUSES = new Set([
  "active",
  "trialing",
  "past_due",
  "unpaid"
]);

export interface BillingCardSummary {
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}

export interface BillingSummary {
  hasStripe: boolean;
  mode: "test" | "live";
  plan: "free" | "pro";
  customerId: string | null;
  subscriptionId: string | null;
  subscriptionStatus: string | null;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  card: BillingCardSummary | null;
}

function toIsoDate(value?: number | null) {
  if (!value) return null;
  return new Date(value * 1000).toISOString();
}

function updateStoredUser(userId: string, updater: (user: any) => void) {
  const users = getUsers<any>();
  const user = users.find((entry) => entry.id === userId);
  if (!user) {
    return null;
  }

  updater(user);
  writeUsers(users);
  return user;
}

export function findUserById(userId: string) {
  return getUsers<any>().find((entry) => entry.id === userId) || null;
}

export async function getOrCreateStripeCustomer(stripe: Stripe, user: any) {
  if (user.stripeCustomerId) {
    try {
      const customer = await stripe.customers.retrieve(user.stripeCustomerId);
      if (!("deleted" in customer) || !customer.deleted) {
        return customer as Stripe.Customer;
      }
    } catch {
      // Fall through to create a replacement customer.
    }
  }

  const customer = await stripe.customers.create({
    email: user.email,
    name: user.fullName || user.email,
    metadata: { userId: user.id }
  });

  updateStoredUser(user.id, (entry) => {
    entry.stripeCustomerId = customer.id;
  });

  return customer;
}

async function resolveSubscription(stripe: Stripe, user: any) {
  if (user.stripeSubscriptionId) {
    try {
      const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId, {
        expand: ["default_payment_method"]
      });
      return subscription;
    } catch {
      // Fall through to customer lookup.
    }
  }

  if (!user.stripeCustomerId) {
    return null;
  }

  const subscriptions = await stripe.subscriptions.list({
    customer: user.stripeCustomerId,
    status: "all",
    limit: 10
  });

  const subscription =
    subscriptions.data.find((entry) => ACTIVE_SUBSCRIPTION_STATUSES.has(entry.status)) ||
    subscriptions.data.find((entry) => entry.status !== "canceled") ||
    null;

  if (subscription && subscription.id !== user.stripeSubscriptionId) {
    updateStoredUser(user.id, (entry) => {
      entry.stripeSubscriptionId = subscription.id;
    });
  }

  return subscription;
}

async function resolvePaymentMethod(
  stripe: Stripe,
  customerId: string,
  subscription: Stripe.Subscription | null
) {
  const subscriptionPaymentMethodId =
    typeof subscription?.default_payment_method === "string"
      ? subscription.default_payment_method
      : subscription?.default_payment_method?.id;

  if (subscriptionPaymentMethodId) {
    return stripe.paymentMethods.retrieve(subscriptionPaymentMethodId);
  }

  const customer = await stripe.customers.retrieve(customerId, {
    expand: ["invoice_settings.default_payment_method"]
  });

  if (!("deleted" in customer) || !customer.deleted) {
    const defaultPaymentMethod =
      typeof customer.invoice_settings.default_payment_method === "string"
        ? customer.invoice_settings.default_payment_method
        : customer.invoice_settings.default_payment_method?.id;

    if (defaultPaymentMethod) {
      return stripe.paymentMethods.retrieve(defaultPaymentMethod);
    }
  }

  const paymentMethods = await stripe.paymentMethods.list({
    customer: customerId,
    type: "card",
    limit: 1
  });

  return paymentMethods.data[0] || null;
}

function syncPlanFields(user: any, subscription: Stripe.Subscription | null) {
  const currentPeriodEnd = (subscription as any)?.current_period_end as number | null | undefined;
  const isPro = Boolean(subscription && ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status));
  user.plan = isPro ? "pro" : "free";
  user.analysesLimit = isPro ? 999999 : 10;
  user.stripeSubscriptionId = subscription?.id || null;
  user.subscriptionStatus = subscription?.status || null;
  user.subscriptionCancelAtPeriodEnd = Boolean(subscription?.cancel_at_period_end);
  user.subscriptionCurrentPeriodEnd = toIsoDate(currentPeriodEnd);
}

export async function syncUserFromSubscription(stripe: Stripe, userId: string) {
  const user = findUserById(userId);
  if (!user) {
    return null;
  }

  const subscription = await resolveSubscription(stripe, user);
  const updated = updateStoredUser(userId, (entry) => {
    syncPlanFields(entry, subscription);
  });

  return { user: updated, subscription };
}

export async function syncUserFromCheckoutSession(stripe: Stripe, sessionId: string) {
  const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["subscription"]
  });

  const userId = checkoutSession.metadata?.userId;
  if (!userId) {
    return null;
  }

  const subscription = checkoutSession.subscription && typeof checkoutSession.subscription !== "string"
    ? checkoutSession.subscription
    : checkoutSession.subscription
      ? await stripe.subscriptions.retrieve(checkoutSession.subscription, {
          expand: ["default_payment_method"]
        })
      : null;

  const updated = updateStoredUser(userId, (entry) => {
    entry.stripeCustomerId =
      typeof checkoutSession.customer === "string"
        ? checkoutSession.customer
        : checkoutSession.customer?.id || entry.stripeCustomerId || null;
    syncPlanFields(entry, subscription);
  });

  return { session: checkoutSession, user: updated, subscription };
}

export async function getBillingSummary(stripe: Stripe | null, user: any): Promise<BillingSummary> {
  const runtime = getRuntimeSettings();
  if (!stripe) {
    return {
      hasStripe: false,
      mode: runtime.stripeMode,
      plan: user.plan,
      customerId: user.stripeCustomerId || null,
      subscriptionId: user.stripeSubscriptionId || null,
      subscriptionStatus: user.subscriptionStatus || null,
      cancelAtPeriodEnd: false,
      currentPeriodEnd: null,
      card: null
    };
  }

  const customer = user.stripeCustomerId ? await getOrCreateStripeCustomer(stripe, user) : null;
  const subscription = await resolveSubscription(stripe, {
    ...user,
    stripeCustomerId: customer?.id || user.stripeCustomerId || null
  });
  const cardPaymentMethod =
    customer?.id ? await resolvePaymentMethod(stripe, customer.id, subscription) : null;

  updateStoredUser(user.id, (entry) => {
    if (customer?.id) {
      entry.stripeCustomerId = customer.id;
    }
    syncPlanFields(entry, subscription);
    entry.stripePaymentMethodId = cardPaymentMethod?.id || null;
  });

  return {
    hasStripe: true,
    mode: runtime.stripeMode,
    plan: subscription && ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status) ? "pro" : user.plan,
    customerId: customer?.id || user.stripeCustomerId || null,
    subscriptionId: subscription?.id || null,
    subscriptionStatus: subscription?.status || null,
    cancelAtPeriodEnd: Boolean(subscription?.cancel_at_period_end),
    currentPeriodEnd: toIsoDate((subscription as any)?.current_period_end as number | null | undefined),
    card:
      cardPaymentMethod?.type === "card" && cardPaymentMethod.card
        ? {
            brand: cardPaymentMethod.card.brand,
            last4: cardPaymentMethod.card.last4,
            expMonth: cardPaymentMethod.card.exp_month,
            expYear: cardPaymentMethod.card.exp_year
          }
        : null
  };
}
