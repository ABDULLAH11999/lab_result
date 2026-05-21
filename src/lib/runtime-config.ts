import { getSettings } from "@/lib/db";

export type StripeMode = "test" | "live";

function cleanStripeValue(value?: string) {
  const normalized = (value || "").trim();
  if (!normalized) return "";
  if (/^(price|pk|sk|whsec)_your_/i.test(normalized)) {
    return "";
  }
  return normalized;
}

export function getRuntimeSettings() {
  const settings = getSettings<any>();

  return {
    stripeMode: (settings?.stripeMode === "live" ? "live" : "test") as StripeMode,
    enableOtp: settings?.enableOtp !== false,
    supportEmail: settings?.supportEmail || process.env.SUPPORT_EMAIL || "hello@labexplain.com",
    mailFrom:
      settings?.mailFrom ||
      process.env.RESEND_FROM ||
      process.env.MAIL_FROM ||
      "LabExplain <noreply@example.com>"
  };
}

export function getStripeEnv(mode?: StripeMode) {
  const activeMode = mode || getRuntimeSettings().stripeMode;

  if (activeMode === "live") {
    return {
      mode: "live" as const,
      secretKey: cleanStripeValue(process.env.STRIPE_SECRET_KEY) || cleanStripeValue(process.env.STRIPE_TEST_SECRET) || "",
      publishableKey:
        cleanStripeValue(process.env.STRIPE_PUBLISHABLE_KEY) ||
        cleanStripeValue(process.env.STRIPE_TEST_KEY) ||
        "",
      webhookSecret: cleanStripeValue(process.env.STRIPE_WEBHOOK_SECRET) || cleanStripeValue(process.env.STRIPE_TEST_WEBHOOK_SECRET) || "",
      priceId: cleanStripeValue(process.env.STRIPE_PRO_PRICE_ID) || cleanStripeValue(process.env.STRIPE_TEST_PRO_PRICE_ID) || ""
    };
  }

  return {
    mode: "test" as const,
    secretKey: cleanStripeValue(process.env.STRIPE_TEST_SECRET) || cleanStripeValue(process.env.STRIPE_SECRET_KEY) || "",
    publishableKey:
      cleanStripeValue(process.env.STRIPE_TEST_KEY) ||
      cleanStripeValue(process.env.STRIPE_PUBLISHABLE_KEY) ||
      "",
    webhookSecret: cleanStripeValue(process.env.STRIPE_TEST_WEBHOOK_SECRET) || cleanStripeValue(process.env.STRIPE_WEBHOOK_SECRET) || "",
    priceId: cleanStripeValue(process.env.STRIPE_TEST_PRO_PRICE_ID) || cleanStripeValue(process.env.STRIPE_PRO_PRICE_ID) || ""
  };
}
