import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ siteId: string }> }) {
  try {
    const user = await requireAuth();
    const { siteId } = await params;

    const site = await prisma.wordPressSite.findFirst({ where: { id: siteId, userId: user.id } });
    if (!site) return NextResponse.json({ error: "Site not found" }, { status: 404 });

    const [contentCount, publishedCount, scheduledCount, recentContent] = await Promise.all([
      prisma.scheduledContent.count({ where: { wordpressSiteId: siteId } }),
      prisma.scheduledContent.count({ where: { wordpressSiteId: siteId, status: "PUBLISHED" } }),
      prisma.scheduledContent.count({ where: { wordpressSiteId: siteId, status: "PENDING" } }),
      prisma.scheduledContent.findMany({ where: { wordpressSiteId: siteId }, orderBy: { createdAt: "desc" }, take: 5, select: { id: true, title: true, status: true, createdAt: true, publishedAt: true } }),
    ]);

    return NextResponse.json({
      site: { id: site.id, name: site.name, url: site.siteUrl, isActive: site.isActive },
      overview: { totalContent: contentCount, published: publishedCount, scheduled: scheduledCount, recentContent },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch overview" }, { status: 500 });
  }
}
