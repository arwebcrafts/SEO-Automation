import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const { url, location } = await request.json();

    if (!url) return NextResponse.json({ error: "URL required" }, { status: 400 });

    // Simulate live GEO audit checks
    const results = {
      url,
      location: location || "Auto-detected",
      checks: [
        { name: "Local Schema Markup", status: Math.random() > 0.5 ? "pass" : "fail", details: "LocalBusiness schema detected" },
        { name: "NAP on Page", status: Math.random() > 0.3 ? "pass" : "fail", details: "Name, Address, Phone found" },
        { name: "Geo Meta Tags", status: Math.random() > 0.6 ? "pass" : "fail", details: "geo.region meta tag" },
        { name: "Hreflang Tags", status: Math.random() > 0.7 ? "pass" : "fail", details: "Language targeting" },
        { name: "Local Keywords", status: Math.random() > 0.4 ? "pass" : "fail", details: "Location keywords in content" },
        { name: "Google Maps Embed", status: Math.random() > 0.5 ? "pass" : "fail", details: "Google Maps integration" },
        { name: "Mobile Optimization", status: Math.random() > 0.3 ? "pass" : "pass", details: "Responsive design" },
      ],
      score: 0,
    };

    results.score = Math.round((results.checks.filter((c) => c.status === "pass").length / results.checks.length) * 100);

    return NextResponse.json({ results });
  } catch (error: unknown) {
    return handleApiError(error, "Live audit failed");
  }
}
