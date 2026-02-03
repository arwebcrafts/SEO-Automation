import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const analyses = await prisma.contentAnalysis.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: Math.min(limit, 50),
      select: {
        id: true,
        baseUrl: true,
        domain: true,
        status: true,
        pagesAnalyzed: true,
        createdAt: true,
        completedAt: true,
        analysisOutput: true,
        dominantKeywords: true,
        contentGaps: true,
        audiencePersona: true,
        tone: true,
        aiSuggestions: true,
      },
    });

    return NextResponse.json({ analyses });
  } catch (error) {
    console.error("Error fetching content analysis history:", error);
    return NextResponse.json(
      { error: "Failed to fetch content analysis history" },
      { status: 500 }
    );
  }
}
