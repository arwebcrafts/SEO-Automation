import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleApiError } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { id, status, scheduledAt, content, featuredImageUrl, targetService, targetServiceUrl } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
    }

    // Verify the post belongs to the user
    const existingPost = await prisma.scheduledContent.findFirst({
      where: { id, userId: user.id },
    });

    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Update the post
    const updateData: any = {};
    
    if (status) updateData.status = status;
    if (scheduledAt) updateData.scheduledFor = new Date(scheduledAt);
    if (content !== undefined) updateData.content = content;
    if (featuredImageUrl !== undefined) updateData.featuredImageUrl = featuredImageUrl;
    if (targetService !== undefined) updateData.targetService = targetService;
    if (targetServiceUrl !== undefined) updateData.targetServiceUrl = targetServiceUrl;

    const updatedPost = await prisma.scheduledContent.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, post: updatedPost });
  } catch (error: unknown) {
    console.error("Error updating post:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update post" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const websiteId = searchParams.get("websiteId");

    const where: any = { userId: user.id };
    if (status) where.status = status;
    if (websiteId) where.wordpressSiteId = websiteId;

    const posts = await prisma.scheduledContent.findMany({
      where,
      include: {
        wordpressSite: true,
      },
      orderBy: {
        scheduledFor: "desc",
      },
    });

    return NextResponse.json({ posts });
  } catch (error: unknown) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch posts" },
      { status: 500 }
    );
  }
}
