import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleApiError } from "@/lib/auth";

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
  } catch (error: unknown) {
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
            headers: { "X-API-Key": apiKey },
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
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Site ID is required" },
        { status: 400 }
      );
    }

    const site = await prisma.wordPressSite.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: site });
  } catch (error: unknown) {
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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Site ID is required" },
        { status: 400 }
      );
    }

    await prisma.wordPressSite.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Site deleted" });
  } catch (error: unknown) {
    console.error("Error deleting site:", error);
    return NextResponse.json(
      { error: "Failed to delete site" },
      { status: 500 }
    );
  }
}
