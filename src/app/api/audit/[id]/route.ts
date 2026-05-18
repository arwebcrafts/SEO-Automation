import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const audit = await prisma.audit.findFirst({
      where: {
        id,
        userId: user.id,
      },
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
        technicalSeoScore: true,
        localSeoResults: true,
        seoResults: true,
        linksResults: true,
        usabilityResults: true,
        performanceResults: true,
        socialResults: true,
        technologyResults: true,
        contentResults: true,
        eeatResults: true,
        technicalSeoResults: true,
        mergedCategories: true,
        createdAt: true,
        completedAt: true,
        recommendations: {
          select: {
            id: true,
            title: true,
            description: true,
            category: true,
            priority: true,
            checkId: true,
          },
        },
      },
    });

    if (!audit) {
      return NextResponse.json(
        { error: "Audit not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(audit);
  } catch (error: unknown) {
    console.error("Audit fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit" },
      { status: 500 }
    );
  }
}
