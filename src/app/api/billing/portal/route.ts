import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createPortalSession } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const user = await requireAuth();
    const sub = await prisma.billingSubscription.findUnique({ where: { userId: user.id } });

    if (!sub?.stripeCustomerId) {
      return NextResponse.json({ error: "No billing account found" }, { status: 404 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const session = await createPortalSession(sub.stripeCustomerId, `${appUrl}/billing`);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create portal session" }, { status: 500 });
  }
}
