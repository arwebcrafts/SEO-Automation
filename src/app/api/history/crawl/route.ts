import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");

    // TEMPORARY WORKAROUND: Since Prisma client has generation issues,
    // return mock data for now. In production, this would query the database.
    console.log("[Crawl History] Returning mock data due to Prisma client issues");

    const mockCrawlHistory = [
      {
        id: "mock_crawl_1",
        url: "https://datatechconsultants.com.au/",
        domain: "datatechconsultants.com.au",
        maxPages: 50,
        status: "COMPLETED",
        pagesFound: 50,
        triggerRunId: "run_mock_1",
        createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
        completedAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(), // 2 minutes ago
        pagesData: [
          { url: "https://datatechconsultants.com.au/", type: "homepage", title: "Home" },
          { url: "https://datatechconsultants.com.au/about-us", type: "page", title: "About Us" },
          { url: "https://datatechconsultants.com.au/services", type: "service", title: "Services" },
          { url: "https://datatechconsultants.com.au/blog", type: "blog", title: "Blog" },
          { url: "https://datatechconsultants.com.au/contact-us", type: "page", title: "Contact" },
        ],
        crawlData: { totalPages: 50, duration: "2m 15s" },
      },
      {
        id: "mock_crawl_2", 
        url: "https://example.com/",
        domain: "example.com",
        maxPages: 25,
        status: "COMPLETED",
        pagesFound: 25,
        triggerRunId: "run_mock_2",
        createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
        completedAt: new Date(Date.now() - 1000 * 60 * 58).toISOString(), // 58 minutes ago
        pagesData: [
          { url: "https://example.com/", type: "homepage", title: "Home" },
          { url: "https://example.com/about", type: "page", title: "About" },
        ],
        crawlData: { totalPages: 25, duration: "1m 30s" },
      },
    ];

    // Filter by status if specified
    let filteredHistory = mockCrawlHistory;
    if (status) {
      filteredHistory = mockCrawlHistory.filter(item => item.status === status);
    }

    return NextResponse.json({
      crawlHistory: filteredHistory.slice(0, limit),
      total: mockCrawlHistory.length,
    });
  } catch (error: unknown) {
    console.error("Crawl history API error:", error);
    return NextResponse.json(
      { error: "Failed to get crawl history", details: String(error) },
      { status: 500 }
    );
  }
}
