import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getStripe, getStripePriceId } from "@/lib/stripe";

export const dynamic = "force-dynamic";

const VALID = new Set([
  "STARTER",
  "PRO",
  "AGENCY",
  "WL_3",
  "WL_10",
  "WL_50",
]);

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const tier = typeof body.tier === "string" ? body.tier.toUpperCase() : "";

    if (!VALID.has(tier)) {
      return NextResponse.json({ error: "Invalid subscription tier" }, { status: 400 });
    }

    const priceId = getStripePriceId(tier);
    const stripe = getStripe();
    const base = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      client_reference_id: user.id,
      customer_email: user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${base}/agency?checkout=success`,
      cancel_url: `${base}/pricing?checkout=cancel`,
      subscription_data: {
        metadata: {
          userId: user.id,
          planKey: tier,
        },
      },
      metadata: {
        userId: user.id,
        planKey: tier,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("Checkout error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Checkout failed" },
      { status: 500 }
    );
  }
}
