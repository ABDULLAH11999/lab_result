import Stripe from "stripe";
import { getStripeEnv, type StripeMode } from "@/lib/runtime-config";

export async function getStripe(mode?: StripeMode) {
  const config = await getStripeEnv(mode);
  if (!config.secretKey) {
    return null;
  }

  return new Stripe(config.secretKey);
}

export async function getStripeClientConfig(mode?: StripeMode) {
  return getStripeEnv(mode);
}
