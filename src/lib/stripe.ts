import Stripe from "stripe";

let stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      typescript: true,
    });
  }
  return stripe;
}

export function getStripePriceId(kind: string): string {
  const envMap: Record<string, string | undefined> = {
    STARTER: process.env.STRIPE_PRICE_STARTER,
    PRO: process.env.STRIPE_PRICE_PRO,
    AGENCY: process.env.STRIPE_PRICE_AGENCY,
    WL_3: process.env.STRIPE_PRICE_WL_3,
    WL_10: process.env.STRIPE_PRICE_WL_10,
    WL_50: process.env.STRIPE_PRICE_WL_50,
  };
  const id = envMap[kind];
  if (!id) {
    throw new Error(`Missing Stripe price env for ${kind}`);
  }
  return id;
}
