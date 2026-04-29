import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { logger } from "@/lib/logger";
import { parseWlMaxSites } from "@/lib/plan-limits";
import type { Plan } from "@prisma/client";
import Stripe from "stripe";

function resolvePlanFromMetadata(planKey: string): Plan {
  const u = planKey.toUpperCase();
  if (u.startsWith("WL")) return "WHITE_LABEL";
  if (u === "STARTER") return "STARTER";
  if (u === "PRO") return "PRO";
  if (u === "AGENCY") return "AGENCY";
  return "FREE";
}

export const dynamic = "force-dynamic";

function periodEnd(sub: Stripe.Subscription): Date {
  const end = sub.current_period_end;
  return new Date(end * 1000);
}

async function applySubscriptionToUser(
  userId: string,
  customerId: string,
  sub: Stripe.Subscription,
  planKey: string
) {
  const plan = resolvePlanFromMetadata(planKey);
  const wl = parseWlMaxSites(planKey);

  await prisma.user.update({
    where: { id: userId },
    data: {
      stripeCustomerId: customerId,
      stripeSubscriptionId: sub.id,
      stripeCurrentPeriodEnd: periodEnd(sub),
      plan,
      wlMaxSites: plan === "WHITE_LABEL" ? wl ?? 3 : null,
    },
  });
}

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    logger.error("STRIPE_WEBHOOK_SECRET missing");
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    logger.error("Stripe webhook signature failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "Bad signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id || session.metadata?.userId;
        if (!userId || !session.subscription) break;

        const stripe = getStripe();
        const sub = await stripe.subscriptions.retrieve(session.subscription as string);
        const customerId = session.customer as string;
        const planKey =
          sub.metadata?.planKey || session.metadata?.planKey || "STARTER";

        await applySubscriptionToUser(userId, customerId, sub, planKey);
        logger.info("Stripe checkout completed", { userId, planKey });
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        let userId: string | undefined = sub.metadata?.userId;
        if (!userId) {
          const u = await prisma.user.findFirst({
            where: { stripeCustomerId: customerId },
          });
          userId = u?.id;
        }
        if (!userId) break;
        const planKey = sub.metadata?.planKey || "PRO";
        await applySubscriptionToUser(userId, customerId, sub, planKey);
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        let userId: string | undefined = sub.metadata?.userId;
        if (!userId) {
          const u = await prisma.user.findFirst({
            where: { stripeCustomerId: customerId },
          });
          userId = u?.id;
        }
        if (!userId) break;
        await prisma.user.update({
          where: { id: userId },
          data: {
            stripeSubscriptionId: null,
            stripeCurrentPeriodEnd: null,
            plan: "FREE",
            wlMaxSites: null,
          },
        });
        logger.info("Stripe subscription deleted", { userId });
        break;
      }
      default:
        break;
    }
  } catch (e) {
    logger.error("Stripe webhook handler error", {
      error: e instanceof Error ? e.message : String(e),
    });
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
