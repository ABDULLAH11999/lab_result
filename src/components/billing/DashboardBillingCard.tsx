"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { loadStripe, type Stripe, type StripeElements } from "@stripe/stripe-js";
import { CreditCard, RefreshCcw, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import UpgradeButton from "@/components/billing/UpgradeButton";

type BillingPayload = {
  billing: {
    hasStripe: boolean;
    mode: "test" | "live";
    plan: "free" | "pro";
    customerId: string | null;
    subscriptionId: string | null;
    subscriptionStatus: string | null;
    cancelAtPeriodEnd: boolean;
    currentPeriodEnd: string | null;
    card: {
      brand: string;
      last4: string;
      expMonth: number;
      expYear: number;
    } | null;
  };
  stripe: {
    publishableKey: string;
    mode: "test" | "live";
  };
};

export default function DashboardBillingCard() {
  const [payload, setPayload] = useState<BillingPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingCard, setUpdatingCard] = useState(false);
  const [submittingCard, setSubmittingCard] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const mountRef = useRef<HTMLDivElement | null>(null);
  const stripeRef = useRef<Stripe | null>(null);
  const elementsRef = useRef<StripeElements | null>(null);
  const paymentElementRef = useRef<any>(null);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  async function loadBilling(showErrors = false) {
    try {
      const response = await fetch("/api/stripe/billing", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Billing details could not be loaded.");
      }
      setPayload(data);
    } catch (error) {
      if (showErrors) {
        toast.error(error instanceof Error ? error.message : "Billing details could not be loaded.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      void loadBilling();
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const checkoutState = searchParams.get("checkout");
    const sessionId = searchParams.get("session_id");
    const billingState = searchParams.get("billing");

    if (checkoutState === "success" && sessionId) {
      void (async () => {
        try {
          const response = await fetch("/api/stripe/checkout/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId })
          });
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || "Upgrade confirmation failed.");
          }

          toast.success("Pro subscription is active.");
          window.dispatchEvent(new Event("auth-change"));
          await loadBilling();
          router.refresh();
          router.replace("/dashboard");
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Upgrade confirmation failed.");
        }
      })();
      return;
    }

    if (billingState === "cancelled") {
      toast.message("Stripe checkout was cancelled.");
      router.replace(pathname);
    } else if (billingState === "already-active") {
      toast.message("Your Pro subscription is already active.");
      router.replace(pathname);
    } else if (billingState === "card-updated") {
      toast.success("Your card details were updated.");
      router.replace(pathname);
    }
  }, [pathname, router, searchParams]);

  useEffect(() => {
    if (!clientSecret || !payload?.stripe.publishableKey || !mountRef.current) {
      return;
    }

    let disposed = false;

    void (async () => {
      const stripe = await loadStripe(payload.stripe.publishableKey);
      if (!stripe || disposed || !mountRef.current) {
        return;
      }

      mountRef.current.innerHTML = "";
      const elements = stripe.elements({
        clientSecret,
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#2563eb",
            borderRadius: "16px"
          }
        }
      });

      const paymentElement = elements.create("payment", {
        layout: "tabs"
      });

      paymentElement.mount(mountRef.current);
      stripeRef.current = stripe;
      elementsRef.current = elements;
      paymentElementRef.current = paymentElement;
    })();

    return () => {
      disposed = true;
      paymentElementRef.current?.destroy?.();
      paymentElementRef.current = null;
      elementsRef.current = null;
    };
  }, [clientSecret, payload?.stripe.publishableKey]);

  async function beginCardUpdate() {
    setUpdatingCard(true);

    try {
      const response = await fetch("/api/stripe/setup-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await response.json();
      if (!response.ok || !data.clientSecret) {
        throw new Error(data.error || "Card update form could not be started.");
      }

      setClientSecret(data.clientSecret);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Card update form could not be started.");
      setUpdatingCard(false);
    }
  }

  async function submitCardUpdate() {
    if (!stripeRef.current || !elementsRef.current) {
      toast.error("Payment form is not ready yet.");
      return;
    }

    setSubmittingCard(true);

    const result = await stripeRef.current.confirmSetup({
      elements: elementsRef.current,
      redirect: "if_required",
      confirmParams: {
        return_url: `${window.location.origin}/dashboard?billing=card-updated`
      }
    });

    if (result.error) {
      toast.error(result.error.message || "Card details could not be verified.");
      setSubmittingCard(false);
      return;
    }

    const paymentMethodId =
      typeof result.setupIntent?.payment_method === "string"
        ? result.setupIntent.payment_method
        : result.setupIntent?.payment_method?.id;

    if (!paymentMethodId) {
      toast.error("Stripe did not return a payment method.");
      setSubmittingCard(false);
      return;
    }

    try {
      const response = await fetch("/api/stripe/payment-method", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethodId })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Card details could not be saved.");
      }

      toast.success("Your card details were updated.");
      setClientSecret(null);
      setUpdatingCard(false);
      window.dispatchEvent(new Event("auth-change"));
      await loadBilling();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Card details could not be saved.");
    } finally {
      setSubmittingCard(false);
    }
  }

  async function cancelSubscription() {
    setCancelling(true);

    try {
      const response = await fetch("/api/stripe/subscription", {
        method: "DELETE"
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Subscription could not be cancelled.");
      }

      toast.success("Subscription cancelled and card removed.");
      setClientSecret(null);
      setUpdatingCard(false);
      window.dispatchEvent(new Event("auth-change"));
      await loadBilling();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Subscription could not be cancelled.");
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <Card className="glass-card border-white/70 p-6">
        <p className="text-sm text-slate-500">Loading billing details...</p>
      </Card>
    );
  }

  const billing = payload?.billing;
  if (!billing) {
    return null;
  }

  return (
    <Card id="billing" className="glass-card border-white/70 p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-3 py-1 text-xs font-semibold text-blue-700">
            <ShieldCheck className="size-3.5" />
            Payment & subscription
          </div>
          <h2 className="mt-4 font-syne text-2xl font-bold text-slate-950">Billing</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {billing.subscriptionId
              ? "Your Stripe subscription and saved payment method are managed here."
              : "Upgrade to Pro to attach a payment method and start your recurring subscription."}
          </p>
          {payload?.stripe.mode === "test" ? (
            <p className="mt-3 text-xs font-semibold text-amber-700">
              Test mode is enabled. Use the Stripe test card ending in 4242.
            </p>
          ) : null}
        </div>

        {!billing.subscriptionId ? (
          <UpgradeButton
            authenticated
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_32px_rgba(37,99,235,0.24)]"
          >
            Go Pro
          </UpgradeButton>
        ) : null}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-[28px] border border-white/70 bg-white/75 p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">Subscription status</p>
              <p className="mt-2 font-syne text-2xl font-bold capitalize text-slate-950">
                {billing.subscriptionStatus || "not subscribed"}
              </p>
            </div>
            <CreditCard className="size-5 text-blue-600" />
          </div>
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <p>Plan: <strong className="capitalize text-slate-950">{billing.plan}</strong></p>
            <p>Mode: <strong className="uppercase text-slate-950">{billing.mode}</strong></p>
            <p>
              Renewal status:{" "}
              <strong className="text-slate-950">
                {billing.cancelAtPeriodEnd ? "Ends at period end" : billing.subscriptionId ? "Auto-renews" : "Inactive"}
              </strong>
            </p>
            <p>
              Current period end:{" "}
              <strong className="text-slate-950">
                {billing.currentPeriodEnd ? new Date(billing.currentPeriodEnd).toLocaleDateString("en-US") : "N/A"}
              </strong>
            </p>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/70 bg-white/75 p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">Active card</p>
              <p className="mt-2 font-syne text-2xl font-bold text-slate-950">
                {billing.card ? `${billing.card.brand.toUpperCase()} ending ${billing.card.last4}` : "No card saved"}
              </p>
            </div>
            <RefreshCcw className="size-5 text-cyan-600" />
          </div>
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <p>
              Expiry:{" "}
              <strong className="text-slate-950">
                {billing.card ? `${billing.card.expMonth}/${billing.card.expYear}` : "N/A"}
              </strong>
            </p>
            <p>
              Next recurring charge uses:{" "}
              <strong className="text-slate-950">
                {billing.card ? `the saved ${billing.card.brand} card` : "no payment method"}
              </strong>
            </p>
          </div>
        </div>
      </div>

      {billing.subscriptionId ? (
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={beginCardUpdate}
            disabled={updatingCard || submittingCard}
            className="inline-flex items-center justify-center rounded-full border border-white/70 bg-white/80 px-5 py-3 text-sm font-semibold text-slate-700 shadow-[0_10px_30px_rgba(15,23,42,0.06)]"
          >
            {updatingCard ? "Card form ready" : "Change card details"}
          </button>
          <button
            type="button"
            onClick={cancelSubscription}
            disabled={cancelling}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-200 bg-white px-5 py-3 text-sm font-semibold text-rose-700"
          >
            <Trash2 className="size-4" />
            {cancelling ? "Removing..." : "Remove card and cancel now"}
          </button>
        </div>
      ) : null}

      {clientSecret ? (
        <div className="mt-6 rounded-[28px] border border-slate-200 bg-white p-5">
          <div ref={mountRef} />
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={submitCardUpdate}
              disabled={submittingCard}
              className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white"
            >
              {submittingCard ? "Saving card..." : "Save this card"}
            </button>
            <button
              type="button"
              onClick={() => {
                paymentElementRef.current?.destroy?.();
                paymentElementRef.current = null;
                setClientSecret(null);
                setUpdatingCard(false);
              }}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
