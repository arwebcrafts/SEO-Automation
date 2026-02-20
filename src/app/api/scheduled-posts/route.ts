import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET - Fetch scheduled posts
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const websiteId = searchParams.get("websiteId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const where: any = { userId: user.id };
    
    if (status) {
      where.status = status;
    }
    
    if (websiteId) {
      where.wordpressSiteId = websiteId;
    }

    const [posts, total] = await Promise.all([
      prisma.scheduledContent.findMany({
        where,
        orderBy: { scheduledFor: "asc" },
        take: limit,
        skip: offset,
        include: {
          wordpressSite: {
            select: {
              id: true,
              name: true,
              siteUrl: true,
            },
          },
        },
      }),
      prisma.scheduledContent.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      posts,
      total,
      hasMore: offset + posts.length < total,
    });
  } catch (error) {
    console.error("[Scheduled Posts] Error fetching:", error);
    return NextResponse.json(
      { error: "Failed to fetch scheduled posts" },
      { status: 500 }
    );
  }
}

// POST - Create scheduled posts
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { posts } = body;

    if (!posts || !Array.isArray(posts) || posts.length === 0) {
      return NextResponse.json(
        { error: "Posts array is required" },
        { status: 400 }
      );
    }

    // Get or create a default WordPress site for the user
    let wordpressSite = await prisma.wordPressSite.findFirst({
      where: { userId: user.id, isActive: true },
    });

    if (!wordpressSite) {
      // Create a default site entry
      wordpressSite = await prisma.wordPressSite.create({
        data: {
          userId: user.id,
          name: "Default Site",
          siteUrl: process.env.WORDPRESS_URL || "https://example.com",
          apiKey: process.env.WORDPRESS_API_KEY || "",
          isActive: true,
        },
      });
    }

    const createdPosts = await Promise.all(
      posts.map(async (post: any) => {
        const scheduledDate = new Date(post.scheduledFor);
        if (post.scheduledTime) {
          const [hours, minutes] = post.scheduledTime.split(":");
          scheduledDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        }

        return prisma.scheduledContent.create({
          data: {
            wordpressSiteId: wordpressSite!.id,
            userId: user.id,
            title: post.title,
            content: post.content,
            excerpt: post.excerpt || post.content?.substring(0, 200) + "...",
            metaDescription: post.metaDescription || post.title,
            focusKeyword: post.focusKeyword || "",
            secondaryKeywords: post.secondaryKeywords || [],
            featuredImageUrl: post.featuredImageUrl || null,
            featuredImageAlt: post.title,
            isAiGeneratedImage: !!post.featuredImageUrl,
            postType: "post",
            postStatus: post.postStatus || "scheduled",
            scheduledFor: scheduledDate,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            status: "PENDING",
            approvalStatus: "APPROVED",
            contentLength: post.wordCount || post.content?.split(/\s+/).length || 0,
            tone: post.tone || "professional",
          },
        });
      })
    );

    return NextResponse.json({
      success: true,
      message: `Successfully scheduled ${createdPosts.length} posts`,
      posts: createdPosts,
    });
  } catch (error) {
    console.error("[Scheduled Posts] Error creating:", error);
    return NextResponse.json(
      { error: "Failed to create scheduled posts" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a scheduled post
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("id");

    if (!postId) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      );
    }

    const post = await prisma.scheduledContent.findFirst({
      where: { id: postId, userId: user.id },
    });

    if (!post) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    await prisma.scheduledContent.delete({
      where: { id: postId },
    });

    return NextResponse.json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error("[Scheduled Posts] Error deleting:", error);
    return NextResponse.json(
      { error: "Failed to delete scheduled post" },
      { status: 500 }
    );
  }
}
