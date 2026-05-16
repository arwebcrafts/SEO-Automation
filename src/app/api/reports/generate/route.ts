import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { domain, type = "seo" } = await request.json();

    if (!domain) return NextResponse.json({ error: "Domain required" }, { status: 400 });

    const recentAudits = await prisma.audit.findMany({
      where: { userId: user.id, domain },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    const report = {
      domain,
      type,
      generatedAt: new Date().toISOString(),
      summary: {
        auditsAnalyzed: recentAudits.length,
        latestScore: recentAudits[0]?.overallScore || 0,
        trend: recentAudits.length > 1 ? (recentAudits[0]?.overallScore || 0) - (recentAudits[1]?.overallScore || 0) : 0,
      },
      audits: recentAudits.map((a) => ({
        id: a.id,
        date: a.createdAt,
        score: a.overallScore,
        grade: a.overallGrade,
        seo: a.seoScore,
        performance: a.performanceScore,
        content: a.contentScore,
      })),
    };

    return NextResponse.json({ report });
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
