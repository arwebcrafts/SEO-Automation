import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { 
      url,
      scheduleWeekly = false,
      alertThresholds = {
        lcp: 2500, // Largest Contentful Paint (ms)
        fid: 100,  // First Input Delay (ms)
        cls: 0.1,  // Cumulative Layout Shift
        fcp: 1800, // First Contentful Paint (ms)
        ttfb: 800  // Time to First Byte (ms)
      }
    } = body;

    if (!url) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    console.log("[Web Vitals] Starting performance analysis:", url);

    // Mock Core Web Vitals analysis - in production, this would use PageSpeed Insights API or Lighthouse
    const mockVitalsData = {
      url,
      timestamp: new Date().toISOString(),
      device: "desktop",
      overallScore: 78,
      metrics: {
        lcp: {
          value: 2340,
          rating: "good", // "good", "needs-improvement", "poor"
          threshold: 2500,
          unit: "ms"
        },
        fid: {
          value: 85,
          rating: "good",
          threshold: 100,
          unit: "ms"
        },
        cls: {
          value: 0.08,
          rating: "good",
          threshold: 0.1,
          unit: ""
        },
        fcp: {
          value: 1650,
          rating: "needs-improvement",
          threshold: 1800,
          unit: "ms"
        },
        ttfb: {
          value: 720,
          rating: "good",
          threshold: 800,
          unit: "ms"
        }
      },
      opportunities: [
        {
          title: "Properly size images",
          description: "Images are not properly sized, leading to wasted bytes",
          savings: "245KB",
          impact: "high"
        },
        {
          title: "Reduce unused CSS",
          description: "42KB of CSS is not used for the above-the-fold content",
          savings: "42KB",
          impact: "medium"
        },
        {
          title: "Eliminate render-blocking resources",
          description: "Some resources are blocking the first paint",
          savings: "180ms",
          impact: "high"
        }
      ],
      diagnostics: [
        {
          title: "Image formats modern",
          description: "WebP, AVIF formats can improve image compression",
          severity: "warning"
        },
        {
          title: "HTTP/2 not used",
          description: "HTTP/2 can improve loading performance",
          severity: "info"
        }
      ],
      audits: {
        performance: 78,
        accessibility: 92,
        "best-practices": 85,
        seo: 88
      },
      alerts: [
        {
          metric: "fcp",
          current: 1650,
          threshold: 1800,
          status: "warning",
          message: "First Contentful Paint is approaching threshold"
        }
      ]
    };

    // Simulate API processing time
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log("[Web Vitals] Analysis completed for:", url);

    return NextResponse.json({
      success: true,
      vitals: mockVitalsData,
      scheduled: scheduleWeekly,
      message: "Performance analysis completed",
    });
  } catch (error: unknown) {
    console.error("[Web Vitals] Error:", error);
    return NextResponse.json(
      { error: "Failed to analyze web vitals", details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");
    const days = parseInt(searchParams.get("days") || "30");

    // Return historical performance data
    const mockHistoricalData = {
      url: url || "https://example.com",
      dateRange: days,
      dailyData: Array.from({ length: days }, (_, i) => ({
        date: new Date(Date.now() - (days - 1 - i) * 86400000).toISOString().split('T')[0],
        overallScore: Math.floor(Math.random() * 20) + 70, // 70-90 range
        lcp: Math.floor(Math.random() * 1000) + 2000, // 2000-3000ms
        fid: Math.floor(Math.random() * 50) + 50, // 50-100ms
        cls: (Math.random() * 0.15).toFixed(3), // 0-0.15
        fcp: Math.floor(Math.random() * 800) + 1400, // 1400-2200ms
        ttfb: Math.floor(Math.random() * 400) + 600 // 600-1000ms
      })),
      trends: {
        improving: ["LCP", "TTFB"],
        declining: ["FCP"],
        stable: ["CLS", "FID"]
      },
      alerts: [
        {
          date: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
          metric: "FCP",
          value: 2100,
          threshold: 1800,
          status: "critical",
          message: "First Contentful Paint exceeded threshold significantly"
        },
        {
          date: new Date(Date.now() - 86400000 * 7).toISOString().split('T')[0],
          metric: "LCP",
          value: 3200,
          threshold: 2500,
          status: "warning",
          message: "Largest Contentful Paint degraded after deployment"
        }
      ],
      recommendations: [
        {
          priority: "high",
          action: "Optimize image loading and compression",
          expectedImprovement: "15-25% faster LCP",
          effort: "medium"
        },
        {
          priority: "medium",
          action: "Implement lazy loading for below-the-fold content",
          expectedImprovement: "10-15% faster FCP",
          effort: "low"
        }
      ]
    };

    return NextResponse.json({
      success: true,
      data: mockHistoricalData,
    });
  } catch (error: unknown) {
    console.error("[Web Vitals GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch performance data", details: String(error) },
      { status: 500 }
    );
  }
}
