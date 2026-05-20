import Stripe from "stripe";
import { getStripeEnv, type StripeMode } from "@/lib/runtime-config";

export function getStripe(mode?: StripeMode) {
  const config = getStripeEnv(mode);
  if (!config.secretKey) {
    return null;
  }

  return new Stripe(config.secretKey);
}

export function getStripeClientConfig(mode?: StripeMode) {
  return getStripeEnv(mode);
}
