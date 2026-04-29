import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { assertReviewsPlan } from "@/lib/reviews-guard";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    assertReviewsPlan(user);
    const wordpressSiteId = request.nextUrl.searchParams.get("wordpressSiteId");
    if (!wordpressSiteId) {
      return NextResponse.json({ error: "wordpressSiteId required" }, { status: 400 });
    }
    const site = await prisma.wordPressSite.findFirst({
      where: { id: wordpressSiteId, userId: user.id },
    });
    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    const startMonth = new Date();
    startMonth.setUTCDate(1);
    startMonth.setUTCHours(0, 0, 0, 0);

    const [sent, pending, failed, contacts, recentCounts] = await Promise.all([
      prisma.reviewRequest.count({
        where: { wordpressSiteId, status: "sent", sentAt: { gte: startMonth } },
      }),
      prisma.reviewRequest.count({
        where: { wordpressSiteId, status: "pending" },
      }),
      prisma.reviewRequest.count({
        where: { wordpressSiteId, status: "failed" },
      }),
      prisma.contact.count({ where: { wordpressSiteId } }),
      prisma.reviewCount.findMany({
        where: { wordpressSiteId },
        orderBy: { recordedAt: "desc" },
        take: 12,
      }),
    ]);

    return NextResponse.json({
      sentThisMonth: sent,
      pending,
      failed,
      contacts,
      reviewCountHistory: recentCounts,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: msg.includes("plan") ? 402 : 500 });
  }
}
