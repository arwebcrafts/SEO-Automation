import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { 
      newContent,
      existingPages,
      domain,
      maxSuggestions = 10
    } = body;

    if (!newContent || !existingPages || !domain) {
      return NextResponse.json(
        { error: "New content, existing pages, and domain are required" },
        { status: 400 }
      );
    }

    console.log("[Internal Links] Analyzing content for internal linking opportunities");

    // Mock internal link analysis - in production, this would use NLP and content analysis
    const mockLinkSuggestions = [
      {
        sentence: "Our web development services include custom applications and responsive design.",
        suggestedLink: {
          url: "/services/web-development",
          anchorText: "web development services",
          reason: "Exact match to existing service page",
          authorityScore: 85,
          relevanceScore: 92
        },
        position: {
          start: 4,
          end: 26,
          context: "Our [web development services] include custom applications and responsive design."
        }
      },
      {
        sentence: "We provide comprehensive SEO solutions for businesses in Islamabad and Rawalpindi.",
        suggestedLink: {
          url: "/services/seo",
          anchorText: "SEO solutions",
          reason: "Partial match to SEO service page",
          authorityScore: 78,
          relevanceScore: 88
        },
        position: {
          start: 17,
          end: 32,
          context: "We provide comprehensive [SEO solutions] for businesses in Islamabad and Rawalpindi."
        }
      },
      {
        sentence: "Contact our team today to discuss your digital transformation needs.",
        suggestedLink: {
          url: "/contact",
          anchorText: "Contact our team",
          reason: "Call-to-action linking to contact page",
          authorityScore: 65,
          relevanceScore: 75
        },
        position: {
          start: 0,
          end: 16,
          context: "[Contact our team] today to discuss your digital transformation needs."
        }
      },
      {
        sentence: "Our mobile app development team has experience with iOS, Android, and cross-platform solutions.",
        suggestedLink: {
          url: "/services/mobile-app-development",
          anchorText: "mobile app development",
          reason: "Exact match to mobile app service page",
          authorityScore: 82,
          relevanceScore: 90
        },
        position: {
          start: 4,
          end: 28,
          context: "Our [mobile app development] team has experience with iOS, Android, and cross-platform solutions."
        }
      },
      {
        sentence: "Learn more about our digital marketing strategies in our latest blog post.",
        suggestedLink: {
          url: "/blog/digital-marketing-strategies",
          anchorText: "digital marketing strategies",
          reason: "Contextual link to relevant blog content",
          authorityScore: 70,
          relevanceScore: 85
        },
        position: {
          start: 25,
          end: 51,
          context: "Learn more about our [digital marketing strategies] in our latest blog post."
        }
      }
    ];

    // Sort by relevance and authority score
    const sortedSuggestions = mockLinkSuggestions
      .sort((a, b) => (b.suggestedLink.relevanceScore + b.suggestedLink.authorityScore) - 
                     (a.suggestedLink.relevanceScore + a.suggestedLink.authorityScore))
      .slice(0, maxSuggestions);

    console.log("[Internal Links] Generated", sortedSuggestions.length, "link suggestions");

    return NextResponse.json({
      success: true,
      suggestions: sortedSuggestions,
      summary: {
        totalSuggestions: sortedSuggestions.length,
        highAuthorityLinks: sortedSuggestions.filter(s => s.suggestedLink.authorityScore >= 80).length,
        contextualLinks: sortedSuggestions.filter(s => s.suggestedLink.reason.includes('contextual')).length,
        servicePageLinks: sortedSuggestions.filter(s => s.suggestedLink.reason.includes('service')).length,
        estimatedLinkJuice: sortedSuggestions.reduce((sum, s) => sum + s.suggestedLink.authorityScore, 0)
      }
    });
  } catch (error: unknown) {
    console.error("[Internal Links] Error:", error);
    return NextResponse.json(
      { error: "Failed to analyze internal links", details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get("domain");

    // Return internal link analytics for the domain
    const mockAnalytics = {
      domain: domain || "example.com",
      totalInternalLinks: 156,
      pagesWithInternalLinks: 42,
      averageLinksPerPage: 3.7,
      linkDistribution: {
        servicePages: 89,
        blogPosts: 45,
        contactPages: 12,
        aboutPages: 10
      },
      topLinkedPages: [
        {
          url: "/services/web-development",
          internalLinks: 23,
          authorityPassed: 450
        },
        {
          url: "/services/seo",
          internalLinks: 18,
          authorityPassed: 380
        },
        {
          url: "/contact",
          internalLinks: 15,
          authorityPassed: 320
        }
      ],
      orphanedPages: [
        {
          url: "/services/legacy-systems",
          reason: "No internal links pointing to this page",
          suggestedActions: ["Add link from homepage", "Include in service navigation", "Mention in related blog posts"]
        }
      ],
      linkOpportunities: [
        {
          sourcePage: "/blog/latest-tech-trends",
          targetPage: "/services/web-development",
          potentialAuthority: 85,
          reason: "High relevance and authority source"
        }
      ]
    };

    return NextResponse.json({
      success: true,
      analytics: mockAnalytics,
    });
  } catch (error: unknown) {
    console.error("[Internal Links GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch internal link analytics", details: String(error) },
      { status: 500 }
    );
  }
}
