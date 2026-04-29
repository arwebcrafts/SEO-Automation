import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// This endpoint is called by cron-job.org every minute to publish scheduled posts
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (optional but recommended for security)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.log("[Cron] Unauthorized request");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    console.log(`[Cron] Checking for scheduled posts at ${now.toISOString()}`);

    // Find posts that are scheduled for now or earlier and haven't been published yet
    const postsToPublish = await prisma.scheduledContent.findMany({
      where: {
        scheduledFor: { lte: now },
        status: "PENDING",
        approvalStatus: "APPROVED",
      },
      include: {
        wordpressSite: true,
      },
      take: 5, // Process max 5 posts per minute to avoid timeouts
    });

    console.log(`[Cron] Found ${postsToPublish.length} posts to publish`);

    if (postsToPublish.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No posts to publish",
        published: 0,
      });
    }

    const results: Array<{ id: string; success: boolean; error?: string; wpPostId?: number }> = [];

    for (const post of postsToPublish) {
      try {
        // Update status to PUBLISHING to prevent duplicate processing
        await prisma.scheduledContent.update({
          where: { id: post.id },
          data: { status: "PUBLISHING" },
        });

        // Get WordPress site credentials
        const wordpressUrl = post.wordpressSite?.siteUrl || process.env.WORDPRESS_URL;
        const apiKey = post.wordpressSite?.apiKey || process.env.WORDPRESS_API_KEY;

        if (!wordpressUrl || !apiKey) {
          throw new Error("WordPress credentials not configured");
        }

        // Publish to WordPress using SEO AutoFix plugin API
        const publishResponse = await fetch(`${wordpressUrl}/wp-json/seo-autofix/v1/content/publish`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-SEO-AutoFix-Key": apiKey,
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            title: post.title,
            content: post.content,
            excerpt: post.excerpt,
            status: "publish",
            featured_image_url: post.featuredImageUrl,
            featured_image_alt: post.featuredImageAlt,
            meta: {
              _yoast_wpseo_focuskw: post.focusKeyword,
              _yoast_wpseo_metadesc: post.metaDescription,
            },
            categories: post.categories,
            tags: post.tags,
          }),
        });

        if (!publishResponse.ok) {
          const errorData = await publishResponse.json().catch(() => ({}));
          throw new Error(errorData.message || `WordPress API error: ${publishResponse.status}`);
        }

        const publishResult = await publishResponse.json();
        const wpPostId = publishResult.post?.id || publishResult.id;

        // Update post as published
        await prisma.scheduledContent.update({
          where: { id: post.id },
          data: {
            status: "PUBLISHED",
            wpPostId: wpPostId,
            publishedAt: new Date(),
            publishError: null,
          },
        });

        console.log(`[Cron] Successfully published post ${post.id} - WP ID: ${wpPostId}`);
        results.push({ id: post.id, success: true, wpPostId });

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error(`[Cron] Failed to publish post ${post.id}:`, errorMessage);

        // Update post with error
        await prisma.scheduledContent.update({
          where: { id: post.id },
          data: {
            status: "FAILED",
            publishError: errorMessage,
          },
        });

        results.push({ id: post.id, success: false, error: errorMessage });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`[Cron] Published: ${successCount}, Failed: ${failCount}`);

    return NextResponse.json({
      success: true,
      message: `Published ${successCount} posts, ${failCount} failed`,
      published: successCount,
      failed: failCount,
      results,
    });

  } catch (error) {
    console.error("[Cron] Error:", error);
    return NextResponse.json(
      { error: "Cron job failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// Also support POST for flexibility
export async function POST(request: NextRequest) {
  return GET(request);
}
