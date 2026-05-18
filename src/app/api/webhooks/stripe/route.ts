import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";


const log = logger.child({ service: "stripe-webhook" });

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    const event = verifyWebhookSignature(body, signature);
    log.info("Stripe webhook received", { type: event.type });

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan;

        if (userId && plan) {
          await prisma.billingSubscription.upsert({
            where: { userId },
            create: { userId, stripeCustomerId: session.customer, stripeSubscriptionId: session.subscription, plan, status: "active" },
            update: { stripeCustomerId: session.customer, stripeSubscriptionId: session.subscription, plan, status: "active" },
          });

          await prisma.user.update({ where: { id: userId }, data: { plan: plan as any } });
          log.info("User plan updated", { userId, plan });
        }
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object as any;
        await prisma.billingSubscription.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: {
            status: sub.status,
            cancelAtPeriodEnd: sub.cancel_at_period_end,
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
          },
        });
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as any;
        const billing = await prisma.billingSubscription.findFirst({ where: { stripeSubscriptionId: sub.id } });
        if (billing) {
          await prisma.billingSubscription.update({ where: { id: billing.id }, data: { status: "canceled" } });
          await prisma.user.update({ where: { id: billing.userId }, data: { plan: "FREE" } });
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    log.error("Stripe webhook error", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 400 });
  }
}
