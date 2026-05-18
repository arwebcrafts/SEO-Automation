import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleApiError } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET - Fetch scheduled content for editing
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get("id");

    if (!contentId) {
      return NextResponse.json(
        { error: "Content ID is required" },
        { status: 400 }
      );
    }

    const content = await prisma.scheduledContent.findFirst({
      where: {
        id: contentId,
        wordpressSite: {
          userId: user.id,
        },
      },
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
    });

    if (!content) {
      return NextResponse.json(
        { error: "Content not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, content }, { status: 200 });
  } catch (error: unknown) {
    return handleApiError(error, "Failed to fetch content");
  }
}

// PUT - Update scheduled content
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await request.json();
    const { id, title, content, excerpt, metaDescription, focusKeyword, secondaryKeywords, featuredImageUrl, featuredImageAlt, categories, tags, scheduledFor, timezone } = body;

    if (!id || !title || !content) {
      return NextResponse.json(
        { error: "id, title, and content are required" },
        { status: 400 }
      );
    }

    const existingContent = await prisma.scheduledContent.findFirst({
      where: {
        id,
        wordpressSite: {
          userId: user.id,
        },
      },
    });

    if (!existingContent) {
      return NextResponse.json(
        { error: "Content not found" },
        { status: 404 }
      );
    }

    if (existingContent.status !== "PENDING" && existingContent.status !== "READY") {
      return NextResponse.json(
        { error: "Cannot edit content that is already being published or published" },
        { status: 400 }
      );
    }

    const updatedContent = await prisma.scheduledContent.update({
      where: { id },
      data: {
        title,
        content,
        excerpt: excerpt || null,
        metaDescription: metaDescription || null,
        focusKeyword,
        secondaryKeywords: secondaryKeywords || [],
        featuredImageUrl: featuredImageUrl || null,
        featuredImageAlt: featuredImageAlt || null,
        categories: categories || [],
        tags: tags || [],
        scheduledFor: scheduledFor ? new Date(scheduledFor) : existingContent.scheduledFor,
        timezone: timezone || existingContent.timezone,
        status: "READY",
      },
      include: {
        wordpressSite: {
          select: { id: true, name: true, siteUrl: true },
        },
      },
    });

    return NextResponse.json(
      { success: true, content: updatedContent, message: "Content updated successfully" },
      { status: 200 }
    );
  } catch (error: unknown) {
    return handleApiError(error, "Failed to update content");
  }
}

// DELETE - Delete scheduled content
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth();

    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get("id");

    if (!contentId) {
      return NextResponse.json(
        { error: "Content ID is required" },
        { status: 400 }
      );
    }

    const existingContent = await prisma.scheduledContent.findFirst({
      where: {
        id: contentId,
        wordpressSite: {
          userId: user.id,
        },
      },
    });

    if (!existingContent) {
      return NextResponse.json(
        { error: "Content not found" },
        { status: 404 }
      );
    }

    if (existingContent.status !== "PENDING" && existingContent.status !== "READY") {
      return NextResponse.json(
        { error: "Cannot delete content that is already being published or published" },
        { status: 400 }
      );
    }

    await prisma.scheduledContent.delete({
      where: { id: contentId },
    });

    return NextResponse.json(
      { success: true, message: "Content deleted successfully" },
      { status: 200 }
    );
  } catch (error: unknown) {
    return handleApiError(error, "Failed to delete content");
  }
}
