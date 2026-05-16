import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("[Stripe] STRIPE_SECRET_KEY not set. Billing features will be disabled.");
}

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-12-18.acacia" as any })
  : null;

export const STRIPE_PRICES = {
  PRO: process.env.STRIPE_PRICE_PRO || "",
  AGENCY: process.env.STRIPE_PRICE_AGENCY || "",
  WHITE_LABEL: process.env.STRIPE_PRICE_WHITE_LABEL || "",
};

export async function createCheckoutSession(params: {
  customerId?: string;
  customerEmail: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}) {
  if (!stripe) throw new Error("Stripe not configured");

  return stripe.checkout.sessions.create({
    mode: "subscription",
    customer: params.customerId || undefined,
    customer_email: params.customerId ? undefined : params.customerEmail,
    line_items: [{ price: params.priceId, quantity: 1 }],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: params.metadata,
    allow_promotion_codes: true,
  });
}

export async function createPortalSession(customerId: string, returnUrl: string) {
  if (!stripe) throw new Error("Stripe not configured");
  return stripe.billingPortal.sessions.create({ customer: customerId, return_url: returnUrl });
}

export function verifyWebhookSignature(payload: string | Buffer, signature: string): Stripe.Event {
  if (!stripe) throw new Error("Stripe not configured");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET not set");
  return stripe.webhooks.constructEvent(payload, signature, secret);
}
