import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Fetch from database - use correct Prisma model name
    const publishes = await (prisma as any).wordPressPublish.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        publishedAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    const total = await (prisma as any).wordPressPublish.count({
      where: {
        userId: user.id,
      },
    });

    return NextResponse.json({
      success: true,
      publishes: publishes.map((publish: any) => ({
        id: publish.id,
        title: publish.title,
        wordpressPostId: publish.wordpressPostId,
        permalink: publish.permalink,
        wordpressEditUrl: publish.wordpressEditUrl,
        status: publish.status,
        location: publish.location,
        contentType: publish.contentType,
        imageUrl: publish.imageUrl,
        imageDownloaded: publish.imageDownloaded,
        publishedAt: publish.publishedAt,
        wordCount: publish.wordCount,
        excerpt: publish.excerpt,
        primaryKeywords: publish.primaryKeywords as string[] || [],
        publishError: publish.publishError,
      })),
      total,
      hasMore: offset + limit < total,
    });
  } catch (error: unknown) {
    console.error("[WordPress History] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch WordPress publishing history", details: String(error) },
      { status: 500 }
    );
  }
}
