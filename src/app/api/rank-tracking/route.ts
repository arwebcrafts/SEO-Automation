import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET: Get rank tracking data
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get("domain");
    const days = parseInt(searchParams.get("days") || "30");

    const since = new Date(Date.now() - days * 86400000);

    const rankings = await prisma.rankTracking.findMany({
      where: {
        userId: user.id,
        ...(domain && { domain }),
        trackedAt: { gte: since },
      },
      orderBy: { trackedAt: "desc" },
      take: 500,
    });

    return NextResponse.json({ rankings });
  } catch (error: unknown) {
    console.error("[Rank Tracking] GET error:", error);
    return handleApiError(error, "Failed to fetch rankings");
  }
}

// POST: Track keywords
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { domain, keywords, device = "desktop", location } = await request.json();

    if (!domain || !keywords?.length) {
      return NextResponse.json({ error: "Domain and keywords required" }, { status: 400 });
    }

    // Get previous positions for comparison
    const previousData = await prisma.rankTracking.findMany({
      where: { userId: user.id, domain, keyword: { in: keywords } },
      orderBy: { trackedAt: "desc" },
      distinct: ["keyword"],
    });

    const prevMap = new Map(previousData.map((r) => [r.keyword, r.position]));

    // Simulate rank tracking (in production, use SEO API)
    const results = await Promise.all(
      keywords.map(async (keyword: string) => {
        const position = Math.floor(Math.random() * 100) + 1;
        const previousPosition = prevMap.get(keyword) || null;

        const record = await prisma.rankTracking.create({
          data: {
            userId: user.id,
            domain,
            keyword,
            position,
            previousPosition,
            device,
            location,
            searchVolume: Math.floor(Math.random() * 10000) + 100,
          },
        });

        return record;
      })
    );

    return NextResponse.json({
      success: true,
      tracked: results.length,
      results,
    });
  } catch (error: unknown) {
    console.error("[Rank Tracking] POST error:", error);
    return handleApiError(error, "Failed to track rankings");
  }
}
