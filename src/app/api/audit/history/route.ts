import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const { searchParams } = new URL(request.url);
    const domain = searchParams.get("domain");
    const limit = parseInt(searchParams.get("limit") || "50");
    const page = parseInt(searchParams.get("page") || "1");

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      userId: user.id,
    };

    if (domain) {
      where.domain = domain;
    }

    // Get audits
    const [audits, total] = await Promise.all([
      prisma.audit.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          url: true,
          domain: true,
          status: true,
          overallScore: true,
          overallGrade: true,
          localSeoScore: true,
          seoScore: true,
          linksScore: true,
          usabilityScore: true,
          performanceScore: true,
          socialScore: true,
          contentScore: true,
          eeatScore: true,
          createdAt: true,
          completedAt: true,
        },
      }),
      prisma.audit.count({ where }),
    ]);

    return NextResponse.json(
      {
        success: true,
        audits,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Audit history error:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit history" },
      { status: 500 }
    );
  }
}
