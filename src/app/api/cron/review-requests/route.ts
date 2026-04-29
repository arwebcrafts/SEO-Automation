import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendScheduledReviewMessage } from "@/lib/review-sender";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appBase = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const now = new Date();
  const pending = await prisma.reviewRequest.findMany({
    where: {
      status: "pending",
      scheduledFor: { lte: now },
    },
    take: 50,
    orderBy: { scheduledFor: "asc" },
    include: {
      contact: true,
      wordpressSite: {
        include: { gbpSnapshot: true, reviewSettings: true },
      },
    },
  });

  let processed = 0;
  for (const req of pending) {
    try {
      const site = req.wordpressSite;
      const settings = site.reviewSettings;
      if (!settings?.isEnabled) {
        await prisma.reviewRequest.update({
          where: { id: req.id },
          data: { status: "failed" },
        });
        continue;
      }
      if (req.contact.optedOut || !req.contact.email) {
        await prisma.reviewRequest.update({
          where: { id: req.id },
          data: { status: "failed" },
        });
        continue;
      }

      const sentCount = await prisma.reviewRequest.count({
        where: {
          contactId: req.contactId,
          status: "sent",
        },
      });
      if (sentCount >= 2) {
        await prisma.reviewRequest.update({
          where: { id: req.id },
          data: { status: "failed" },
        });
        continue;
      }

      const msgType = req.messageType === "followup" ? "followup" : "initial";

      await sendScheduledReviewMessage(
        {
          contact: req.contact,
          settings,
          site,
          businessName: site.name,
          placeId: site.gbpPlaceId || site.gbpSnapshot?.placeId || null,
          appBaseUrl: appBase,
        },
        msgType
      );

      await prisma.reviewRequest.update({
        where: { id: req.id },
        data: { status: "sent", sentAt: new Date() },
      });

      if (
        msgType === "initial" &&
        settings.followUpEnabled &&
        sentCount === 0
      ) {
        const followDays = settings.followUpDelayDays ?? 3;
        await prisma.reviewRequest.create({
          data: {
            contactId: req.contactId,
            wordpressSiteId: req.wordpressSiteId,
            channel: "email",
            status: "pending",
            messageType: "followup",
            scheduledFor: new Date(
              Date.now() + followDays * 24 * 60 * 60 * 1000
            ),
          },
        });
      }

      processed++;
    } catch (e) {
      logger.error("review send failed", {
        id: req.id,
        error: e instanceof Error ? e.message : String(e),
      });
      await prisma.reviewRequest.update({
        where: { id: req.id },
        data: { status: "failed" },
      });
    }
  }

  return NextResponse.json({ ok: true, processed });
}
