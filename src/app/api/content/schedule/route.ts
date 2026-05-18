import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleApiError } from "@/lib/auth";
export const dynamic = "force-dynamic";


// GET: Fetch scheduled content
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId");
    const status = searchParams.get("status");
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    const where: any = {
      userId: user.id, // Only fetch content for the authenticated user
    };
    
    if (siteId) {
      where.wordpressSiteId = siteId;
    }
    
    if (status) {
      where.status = status;
    }
    
    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      where.scheduledFor = {
        gte: startDate,
        lte: endDate,
      };
    }

    const content = await prisma.scheduledContent.findMany({
      where,
      include: {
        wordpressSite: {
          select: {
            id: true,
            name: true,
            siteUrl: true,
          },
        },
        keyword: true,
        contentPlan: true,
      },
      orderBy: {
        scheduledFor: "asc",
      },
    });

    return NextResponse.json({ success: true, data: content });
  } catch (error: unknown) {
    console.error("Error fetching scheduled content:", error);
    return NextResponse.json(
      { error: "Failed to fetch scheduled content" },
      { status: 500 }
    );
  }
}

// POST: Create new scheduled content
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const {
      wordpressSiteId,
      contentPlanId,
      keywordId,
      title,
      slug,
      content,
      excerpt,
      metaDescription,
      focusKeyword,
      secondaryKeywords,
      featuredImageUrl,
      featuredImageAlt,
      isAiGeneratedImage,
      postType,
      categories,
      tags,
      scheduledFor,
      timezone,
      seoScore,
      readabilityScore,
    } = body;

    // Validate required fields
    if (!wordpressSiteId || !title || !content || !focusKeyword || !scheduledFor) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create the scheduled content with userId
    const scheduledContent = await prisma.scheduledContent.create({
      data: {
        wordpressSiteId,
        contentPlanId,
        keywordId,
        userId: user.id, // Associate with authenticated user
        title,
        slug,
        content,
        excerpt,
        metaDescription,
        focusKeyword,
        secondaryKeywords: secondaryKeywords || [],
        featuredImageUrl,
        featuredImageAlt,
        isAiGeneratedImage: isAiGeneratedImage || false,
        postType: postType || "post",
        categories: categories || [],
        tags: tags || [],
        scheduledFor: new Date(scheduledFor),
        timezone: timezone || "UTC",
        seoScore,
        readabilityScore,
        status: "PENDING",
        approvalStatus: "PENDING",
      },
    });

    return NextResponse.json({ success: true, data: scheduledContent });
  } catch (error: unknown) {
    console.error("Error creating scheduled content:", error);
    return NextResponse.json(
      { error: "Failed to create scheduled content" },
      { status: 500 }
    );
  }
}

// PUT: Update scheduled content
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Content ID is required" },
        { status: 400 }
      );
    }

    // Verify ownership before updating
    const existingContent = await prisma.scheduledContent.findUnique({
      where: { id },
      select: { userId: true }
    });

    if (!existingContent || existingContent.userId !== user.id) {
      return NextResponse.json(
        { error: "Content not found or access denied" },
        { status: 403 }
      );
    }

    // If updating scheduledFor, convert to Date
    if (updateData.scheduledFor) {
      updateData.scheduledFor = new Date(updateData.scheduledFor);
    }

    const updatedContent = await prisma.scheduledContent.update({
      where: { id },
      data: updateData,
      include: {
        wordpressSite: true,
      },
    });

    return NextResponse.json({ success: true, data: updatedContent });
  } catch (error: unknown) {
    console.error("Error updating scheduled content:", error);
    return NextResponse.json(
      { error: "Failed to update scheduled content" },
      { status: 500 }
    );
  }
}

// DELETE: Delete scheduled content
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Content ID is required" },
        { status: 400 }
      );
    }

    // Verify ownership before deleting
    const existingContent = await prisma.scheduledContent.findUnique({
      where: { id },
      select: { userId: true }
    });

    if (!existingContent || existingContent.userId !== user.id) {
      return NextResponse.json(
        { error: "Content not found or access denied" },
        { status: 403 }
      );
    }

    await prisma.scheduledContent.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Content deleted" });
  } catch (error: unknown) {
    console.error("Error deleting scheduled content:", error);
    return NextResponse.json(
      { error: "Failed to delete scheduled content" },
      { status: 500 }
    );
  }
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
