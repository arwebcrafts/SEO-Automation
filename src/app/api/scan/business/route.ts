import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const { query, location } = await request.json();

    if (!query) return NextResponse.json({ error: "Search query required" }, { status: 400 });

    // Simulate business scan (production: use Google Places / SerpAPI)
    const results = {
      query,
      location: location || "Auto-detected",
      businesses: Array.from({ length: 5 }, (_, i) => ({
        rank: i + 1,
        name: `Business ${i + 1}`,
        rating: (4 + Math.random()).toFixed(1),
        reviews: Math.floor(Math.random() * 500) + 10,
        address: `${Math.floor(Math.random() * 999) + 1} Main St, ${location || "City"}`,
        phone: `(555) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
        website: `https://business${i + 1}.example.com`,
        claimed: Math.random() > 0.3,
      })),
      insights: { totalResults: 5, averageRating: 4.3, topCategory: query },
    };

    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json({ error: "Scan failed" }, { status: 500 });
  }
}
