import { getSettings } from "@/lib/db";

export type StripeMode = "test" | "live";

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
      secretKey: process.env.STRIPE_SECRET_KEY || process.env.STRIPE_TEST_SECRET || "",
      publishableKey:
        process.env.STRIPE_PUBLISHABLE_KEY ||
        process.env.STRIPE_TEST_KEY ||
        "",
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || process.env.STRIPE_TEST_WEBHOOK_SECRET || "",
      priceId: process.env.STRIPE_PRO_PRICE_ID || process.env.STRIPE_TEST_PRO_PRICE_ID || ""
    };
  }

  return {
    mode: "test" as const,
    secretKey: process.env.STRIPE_TEST_SECRET || process.env.STRIPE_SECRET_KEY || "",
    publishableKey:
      process.env.STRIPE_TEST_KEY ||
      process.env.STRIPE_PUBLISHABLE_KEY ||
      "",
    webhookSecret: process.env.STRIPE_TEST_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET || "",
    priceId: process.env.STRIPE_TEST_PRO_PRICE_ID || process.env.STRIPE_PRO_PRICE_ID || ""
  };
}
