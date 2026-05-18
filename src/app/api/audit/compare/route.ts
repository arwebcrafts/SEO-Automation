import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleApiError } from "@/lib/auth";


export const dynamic = "force-dynamic";


export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const { searchParams } = new URL(request.url);
    const domain = searchParams.get("domain");

    if (!domain) {
      return NextResponse.json(
        { error: "Domain is required" },
        { status: 400 }
      );
    }

    // Get the two most recent audits for comparison
    const audits = await prisma.audit.findMany({
      where: {
        userId: user.id,
        domain,
        status: "COMPLETED",
      },
      orderBy: { createdAt: "desc" },
      take: 2,
      select: {
        id: true,
        url: true,
        domain: true,
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
    });

    if (audits.length < 2) {
      return NextResponse.json(
        {
          success: true,
          comparison: null,
          message: "Need at least 2 completed audits to compare",
        },
        { status: 200 }
      );
    }

    const [current, previous] = audits;

    // Calculate changes
    const comparison = {
      current: {
        id: current.id,
        date: current.createdAt,
        overallScore: current.overallScore,
        overallGrade: current.overallGrade,
        scores: {
          localSeo: current.localSeoScore,
          seo: current.seoScore,
          links: current.linksScore,
          usability: current.usabilityScore,
          performance: current.performanceScore,
          social: current.socialScore,
          content: current.contentScore,
          eeat: current.eeatScore,
        },
      },
      previous: {
        id: previous.id,
        date: previous.createdAt,
        overallScore: previous.overallScore,
        overallGrade: previous.overallGrade,
        scores: {
          localSeo: previous.localSeoScore,
          seo: previous.seoScore,
          links: previous.linksScore,
          usability: previous.usabilityScore,
          performance: previous.performanceScore,
          social: previous.socialScore,
          content: previous.contentScore,
          eeat: previous.eeatScore,
        },
      },
      changes: {
        overallScore: {
          value: (current.overallScore || 0) - (previous.overallScore || 0),
          improved: (current.overallScore || 0) > (previous.overallScore || 0),
        },
        localSeo: {
          value: (current.localSeoScore || 0) - (previous.localSeoScore || 0),
          improved: (current.localSeoScore || 0) > (previous.localSeoScore || 0),
        },
        seo: {
          value: (current.seoScore || 0) - (previous.seoScore || 0),
          improved: (current.seoScore || 0) > (previous.seoScore || 0),
        },
        links: {
          value: (current.linksScore || 0) - (previous.linksScore || 0),
          improved: (current.linksScore || 0) > (previous.linksScore || 0),
        },
        usability: {
          value: (current.usabilityScore || 0) - (previous.usabilityScore || 0),
          improved: (current.usabilityScore || 0) > (previous.usabilityScore || 0),
        },
        performance: {
          value: (current.performanceScore || 0) - (previous.performanceScore || 0),
          improved: (current.performanceScore || 0) > (previous.performanceScore || 0),
        },
        social: {
          value: (current.socialScore || 0) - (previous.socialScore || 0),
          improved: (current.socialScore || 0) > (previous.socialScore || 0),
        },
        content: {
          value: (current.contentScore || 0) - (previous.contentScore || 0),
          improved: (current.contentScore || 0) > (previous.contentScore || 0),
        },
        eeat: {
          value: (current.eeatScore || 0) - (previous.eeatScore || 0),
          improved: (current.eeatScore || 0) > (previous.eeatScore || 0),
        },
      },
      summary: {
        daysBetween: Math.floor(
          (new Date(current.createdAt).getTime() - new Date(previous.createdAt).getTime()) /
            (1000 * 60 * 60 * 24)
        ),
        improvedCategories: Object.keys({
          localSeo: (current.localSeoScore || 0) > (previous.localSeoScore || 0),
          seo: (current.seoScore || 0) > (previous.seoScore || 0),
          links: (current.linksScore || 0) > (previous.linksScore || 0),
          usability: (current.usabilityScore || 0) > (previous.usabilityScore || 0),
          performance: (current.performanceScore || 0) > (previous.performanceScore || 0),
          social: (current.socialScore || 0) > (previous.socialScore || 0),
          content: (current.contentScore || 0) > (previous.contentScore || 0),
          eeat: (current.eeatScore || 0) > (previous.eeatScore || 0),
        }).filter((key) => {
          const scores = {
            localSeo: (current.localSeoScore || 0) > (previous.localSeoScore || 0),
            seo: (current.seoScore || 0) > (previous.seoScore || 0),
            links: (current.linksScore || 0) > (previous.linksScore || 0),
            usability: (current.usabilityScore || 0) > (previous.usabilityScore || 0),
            performance: (current.performanceScore || 0) > (previous.performanceScore || 0),
            social: (current.socialScore || 0) > (previous.socialScore || 0),
            content: (current.contentScore || 0) > (previous.contentScore || 0),
            eeat: (current.eeatScore || 0) > (previous.eeatScore || 0),
          };
          return scores[key as keyof typeof scores];
        }).length,
        declinedCategories: 8 - Object.keys({
          localSeo: (current.localSeoScore || 0) > (previous.localSeoScore || 0),
          seo: (current.seoScore || 0) > (previous.seoScore || 0),
          links: (current.linksScore || 0) > (previous.linksScore || 0),
          usability: (current.usabilityScore || 0) > (previous.usabilityScore || 0),
          performance: (current.performanceScore || 0) > (previous.performanceScore || 0),
          social: (current.socialScore || 0) > (previous.socialScore || 0),
          content: (current.contentScore || 0) > (previous.contentScore || 0),
          eeat: (current.eeatScore || 0) > (previous.eeatScore || 0),
        }).filter((key) => {
          const scores = {
            localSeo: (current.localSeoScore || 0) > (previous.localSeoScore || 0),
            seo: (current.seoScore || 0) > (previous.seoScore || 0),
            links: (current.linksScore || 0) > (previous.linksScore || 0),
            usability: (current.usabilityScore || 0) > (previous.usabilityScore || 0),
            performance: (current.performanceScore || 0) > (previous.performanceScore || 0),
            social: (current.socialScore || 0) > (previous.socialScore || 0),
            content: (current.contentScore || 0) > (previous.contentScore || 0),
            eeat: (current.eeatScore || 0) > (previous.eeatScore || 0),
          };
          return scores[key as keyof typeof scores];
        }).length,
      },
    };

    return NextResponse.json(
      {
        success: true,
        comparison,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Audit comparison error:", error);
    return NextResponse.json(
      { error: "Failed to compare audits" },
      { status: 500 }
    );
  }
}
