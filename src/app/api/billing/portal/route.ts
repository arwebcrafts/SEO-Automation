import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    if (!user.stripeCustomerId) {
      return NextResponse.json(
        { error: "No billing account yet. Start a subscription from the pricing page." },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    const base = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${base}/agency`,
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("Portal error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Portal failed" },
      { status: 500 }
    );
  }
}
