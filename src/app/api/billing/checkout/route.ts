import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createCheckoutSession, STRIPE_PRICES } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { plan } = await request.json();

    if (!plan || !["PRO", "AGENCY", "WHITE_LABEL"].includes(plan)) {
      return NextResponse.json({ error: "Valid plan required" }, { status: 400 });
    }

    const priceId = STRIPE_PRICES[plan as keyof typeof STRIPE_PRICES];
    if (!priceId) {
      return NextResponse.json({ error: "Stripe not configured for this plan" }, { status: 400 });
    }

    // Check for existing subscription
    const sub = await prisma.billingSubscription.findUnique({ where: { userId: user.id } });
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const session = await createCheckoutSession({
      customerId: sub?.stripeCustomerId || undefined,
      customerEmail: user.email,
      priceId,
      successUrl: `${appUrl}/billing?success=true`,
      cancelUrl: `${appUrl}/billing?canceled=true`,
      metadata: { userId: user.id, plan },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[Billing Checkout] Error:", error);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
