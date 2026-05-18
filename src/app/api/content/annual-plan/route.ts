import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { domain, year, goals, industry } = await request.json();

    if (!domain) return NextResponse.json({ error: "Domain required" }, { status: 400 });
    const targetYear = year || new Date().getFullYear();

    const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    const contentTypes = ["blog", "guide", "case-study", "landing-page", "video-script"];

    const annualPlan = months.map((month, i) => ({
      month,
      monthNumber: i + 1,
      theme: `${industry || "Business"} Growth Strategy - ${month}`,
      pieces: Array.from({ length: 4 }, (_, j) => ({
        week: j + 1,
        title: `${month} Week ${j + 1} Content`,
        type: contentTypes[Math.floor(Math.random() * contentTypes.length)],
        targetKeyword: `${industry || "business"} tips ${month.toLowerCase()}`,
        estimatedTraffic: Math.floor(Math.random() * 500) + 100,
      })),
      goals: goals || ["Increase organic traffic", "Build authority"],
    }));

    return NextResponse.json({ success: true, year: targetYear, domain, plan: annualPlan });
  } catch (error: unknown) {
    return handleApiError(error, "Failed to generate annual plan");
  }
}
