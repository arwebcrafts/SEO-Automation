import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ siteId: string }> }
) {
  try {
    const user = await requireAuth();
    const { siteId } = await ctx.params;

    const site = await prisma.wordPressSite.findFirst({
      where: { id: siteId, userId: user.id },
      include: {
        gbpSnapshot: true,
        keywords: { orderBy: { searchVolume: "desc" }, take: 20 },
        scheduledContent: {
          where: { status: "PUBLISHED" },
          orderBy: { publishedAt: "desc" },
          take: 5,
        },
      },
    });

    if (!site) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    let host = "";
    try {
      host = new URL(site.siteUrl).hostname;
    } catch {
      host = "";
    }
    const latestAudit = await prisma.audit.findFirst({
      where: host
        ? {
            userId: user.id,
            OR: [
              { domain: { contains: host, mode: "insensitive" } },
              { url: { contains: host, mode: "insensitive" } },
            ],
          }
        : { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    const reviewMonthStart = new Date();
    reviewMonthStart.setUTCDate(1);
    reviewMonthStart.setUTCHours(0, 0, 0, 0);

    const [reviewSent, chatLeadsWeek] = await Promise.all([
      prisma.reviewRequest.count({
        where: {
          wordpressSiteId: siteId,
          status: "sent",
          sentAt: { gte: reviewMonthStart },
        },
      }),
      prisma.chatbotLead.count({
        where: {
          wordpressSiteId: siteId,
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    const seoScore = latestAudit?.overallScore ?? null;
    const aeoGeoChecklist = [
      { id: "1", label: "Latest technical audit completed", pass: !!latestAudit?.completedAt },
      { id: "2", label: "Primary local keywords tracked", pass: site.keywords.length > 0 },
      { id: "3", label: "GBP snapshot linked", pass: !!site.gbpSnapshot },
      { id: "4", label: "Published posts this period", pass: site.scheduledContent.length > 0 },
    ];

    return NextResponse.json({
      site: {
        id: site.id,
        name: site.name,
        siteUrl: site.siteUrl,
      },
      health: {
        seoScore,
        grade: latestAudit?.overallGrade ?? null,
        aeoGeoChecklist,
      },
      gbp: site.gbpSnapshot,
      recentPosts: site.scheduledContent.map((p) => ({
        id: p.id,
        title: p.title,
        status: p.status,
        publishedAt: p.publishedAt,
      })),
      keywords: site.keywords,
      reviewsSentThisMonth: reviewSent,
      chatbotLeadsThisWeek: chatLeadsWeek,
      lastAuditAt: latestAudit?.completedAt ?? latestAudit?.updatedAt ?? null,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error" },
      { status: 500 }
    );
  }
}
