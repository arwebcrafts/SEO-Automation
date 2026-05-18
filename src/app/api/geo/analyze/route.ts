import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { domain, location, keywords } = await request.json();

    if (!domain || !location) {
      return NextResponse.json({ error: "Domain and location required" }, { status: 400 });
    }

    // Create GEO audit record
    const audit = await prisma.geoAudit.create({
      data: { userId: user.id, domain, location, status: "running" },
    });

    // Simulate GEO analysis (production: use APIs)
    const results = {
      location,
      localSeoScore: Math.floor(Math.random() * 40) + 60,
      napConsistency: Math.random() > 0.3,
      localListings: Math.floor(Math.random() * 20) + 5,
      localKeywordRankings: (keywords || [`${domain.split(".")[0]} ${location}`]).map((kw: string) => ({
        keyword: kw,
        position: Math.floor(Math.random() * 50) + 1,
        localPack: Math.random() > 0.5,
      })),
      recommendations: [
        { priority: "HIGH", action: "Claim and optimize Google Business Profile" },
        { priority: "HIGH", action: "Ensure NAP consistency across all directories" },
        { priority: "MEDIUM", action: `Create location-specific landing page for ${location}` },
        { priority: "MEDIUM", action: "Build local citations on top directories" },
        { priority: "LOW", action: "Add local schema markup to website" },
      ],
      competitors: [
        { name: "Competitor A", position: 1, listingScore: 92 },
        { name: "Competitor B", position: 2, listingScore: 87 },
        { name: "Competitor C", position: 3, listingScore: 81 },
      ],
    };

    // Update audit with results
    await prisma.geoAudit.update({
      where: { id: audit.id },
      data: { results, score: results.localSeoScore, status: "completed", completedAt: new Date() },
    });

    return NextResponse.json({ success: true, audit: { ...audit, results, score: results.localSeoScore } });
  } catch (error: unknown) {
    console.error("[GEO Analyze] Error:", error);
    return handleApiError(error, "Failed to analyze location");
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get("domain");

    const audits = await prisma.geoAudit.findMany({
      where: { userId: user.id, ...(domain && { domain }) },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ audits });
  } catch (error: unknown) {
    return handleApiError(error, "Failed to fetch GEO audits");
  }
}
