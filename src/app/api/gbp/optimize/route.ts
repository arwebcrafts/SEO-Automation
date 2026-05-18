import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const { businessName, address, phone, website, category, description } = await request.json();

    if (!businessName) return NextResponse.json({ error: "Business name required" }, { status: 400 });

    const optimizations = {
      businessName: { current: businessName, suggestions: [
        "Include primary keyword in business name if natural",
        "Ensure name matches exactly across all platforms",
      ]},
      category: { current: category || "Not set", suggestions: [
        "Select the most specific primary category",
        "Add relevant secondary categories (up to 9)",
      ]},
      description: {
        current: description || "No description",
        optimized: `${businessName} provides professional ${(category || "services").toLowerCase()} in ${address || "your area"}. With years of experience, we deliver quality results that exceed expectations. Contact us today for a free consultation.`,
        suggestions: ["Include top keywords naturally", "Add call-to-action", "Mention service area"],
      },
      photos: { suggestions: [
        "Add at least 10 high-quality photos",
        "Include logo, cover photo, interior, exterior, team, and product photos",
        "Add photos weekly to show activity",
      ]},
      reviews: { suggestions: [
        "Respond to all reviews within 24 hours",
        "Ask satisfied customers for reviews",
        "Address negative reviews professionally",
      ]},
      posts: { suggestions: [
        "Post weekly updates, offers, or events",
        "Include photos and calls-to-action",
        "Use relevant keywords naturally",
      ]},
      score: Math.floor(Math.random() * 30) + 60,
    };

    return NextResponse.json({ success: true, optimizations });
  } catch (error: unknown) {
    return handleApiError(error, "Failed to generate optimizations");
  }
}
