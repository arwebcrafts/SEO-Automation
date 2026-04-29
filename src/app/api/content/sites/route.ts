import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { getPlanLimits, hasActiveSubscription } from "@/lib/plan-limits";

export const dynamic = "force-dynamic";

// GET: Fetch WordPress sites for authenticated user
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const sites = await prisma.wordPressSite.findMany({
      where: {
        userId: user.id,
        isActive: true,
      },
      include: {
        _count: {
          select: {
            scheduledContent: true,
            keywords: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ success: true, data: sites });
  } catch (error) {
    console.error("Error fetching sites:", error);
    return NextResponse.json(
      { error: "Failed to fetch sites" },
      { status: 500 }
    );
  }
}

// POST: Add new WordPress site for authenticated user
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const limits = getPlanLimits(user);
    const existingCount = await prisma.wordPressSite.count({
      where: { userId: user.id, isActive: true },
    });

    if (limits.maxSites <= 0 || existingCount >= limits.maxSites) {
      const needsBilling =
        user.plan === "FREE" || !hasActiveSubscription(user);
      return NextResponse.json(
        {
          error: needsBilling
            ? "Active subscription required to connect a site."
            : "Site limit reached for your plan. Upgrade to add more sites.",
          code: "PLAN_LIMIT",
        },
        { status: 402 }
      );
    }

    if (user.plan === "WHITE_LABEL" && limits.requiresByok) {
      if (!user.openaiApiKeyEncrypted) {
        return NextResponse.json(
          {
            error:
              "Add your OpenAI API key in settings to enable AI features on the white-label plan.",
            code: "BYOK_REQUIRED",
          },
          { status: 402 }
        );
      }
    }

    const body = await request.json();
    const {
      name,
      siteUrl,
      apiKey,
      wpUsername,
      wpAppPassword,
    } = body;

    if (!name || !siteUrl) {
      return NextResponse.json(
        { error: "Name and site URL are required" },
        { status: 400 }
      );
    }

    // Normalize URL
    const normalizedUrl = siteUrl.replace(/\/$/, "");

    // Verify connection if credentials provided
    let connectionVerified = false;
    if (apiKey) {
      try {
        const verifyResponse = await fetch(
          `${normalizedUrl}/wp-json/seo-autofix/v1/verify`,
          {
            headers: {
              "X-SEO-AutoFix-Key": apiKey,
              Authorization: `Bearer ${apiKey}`,
            },
          }
        );
        connectionVerified = verifyResponse.ok;
      } catch {
        // Connection failed, but still allow adding
      }
    }

    const site = await prisma.wordPressSite.create({
      data: {
        userId: user.id,
        name,
        siteUrl: normalizedUrl,
        apiKey: apiKey || "",
        wpUsername,
        wpAppPassword,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: site,
      connectionVerified,
    });
  } catch (error: any) {
    console.error("Error creating site:", error);
    
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "This site URL already exists for your account" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to create site" },
      { status: 500 }
    );
  }
}

// PUT: Update WordPress site
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Site ID is required" },
        { status: 400 }
      );
    }

    const owned = await prisma.wordPressSite.findFirst({
      where: { id, userId: user.id },
    });
    if (!owned) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const site = await prisma.wordPressSite.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: site });
  } catch (error) {
    console.error("Error updating site:", error);
    return NextResponse.json(
      { error: "Failed to update site" },
      { status: 500 }
    );
  }
}

// DELETE: Remove WordPress site
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Site ID is required" },
        { status: 400 }
      );
    }

    const owned = await prisma.wordPressSite.findFirst({
      where: { id, userId: user.id },
    });
    if (!owned) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.wordPressSite.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Site deleted" });
  } catch (error) {
    console.error("Error deleting site:", error);
    return NextResponse.json(
      { error: "Failed to delete site" },
      { status: 500 }
    );
  }
}
