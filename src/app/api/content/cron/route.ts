import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";


// This endpoint will be called by cron-job.org every minute
// It checks for scheduled content that needs to be published

export async function GET(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    
    // Find all content that should be published now
    const pendingContent = await prisma.scheduledContent.findMany({
      where: {
        status: "PENDING",
        scheduledFor: {
          lte: now,
        },
      },
      include: {
        wordpressSite: true,
      },
      take: 10, // Process max 10 at a time to avoid timeout
    });

    if (pendingContent.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No content to publish",
        processed: 0,
      });
    }

    const results = [];

    for (const content of pendingContent) {
      // Mark as publishing
      await prisma.scheduledContent.update({
        where: { id: content.id },
        data: { status: "PUBLISHING" },
      });

      try {
        // Publish to WordPress
        const publishResult = await publishToWordPress(content, content.wordpressSite);

        // Update status
        await prisma.scheduledContent.update({
          where: { id: content.id },
          data: {
            status: "PUBLISHED",
            wpPostId: publishResult.postId,
            publishedAt: new Date(),
          },
        });

        results.push({
          id: content.id,
          title: content.title,
          status: "published",
          wpPostId: publishResult.postId,
          wpUrl: publishResult.url,
        });
      } catch (error) {
        // Mark as failed
        await prisma.scheduledContent.update({
          where: { id: content.id },
          data: {
            status: "FAILED",
            publishError: error instanceof Error ? error.message : "Unknown error",
          },
        });

        results.push({
          id: content.id,
          title: content.title,
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${results.length} content items`,
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Cron job failed" },
      { status: 500 }
    );
  }
}

// Publish content to WordPress via REST API
async function publishToWordPress(
  content: any,
  site: any
): Promise<{ postId: number; url: string }> {
  const { siteUrl, wpUsername, wpAppPassword, apiKey } = site;

  // Method 1: Use WordPress REST API with Application Password
  if (wpUsername && wpAppPassword) {
    return await publishViaRestApi(content, siteUrl, wpUsername, wpAppPassword);
  }

  // Method 2: Use our plugin API
  if (apiKey) {
    return await publishViaPlugin(content, siteUrl, apiKey);
  }

  throw new Error("No authentication method available for this site");
}

// Publish via WordPress REST API
async function publishViaRestApi(
  content: any,
  siteUrl: string,
  username: string,
  appPassword: string
): Promise<{ postId: number; url: string }> {
  const credentials = Buffer.from(`${username}:${appPassword}`).toString("base64");
  
  // First, upload featured image if exists
  let featuredMediaId: number | undefined;
  
  if (content.featuredImageUrl) {
    try {
      featuredMediaId = await uploadMediaToWordPress(
        content.featuredImageUrl,
        content.featuredImageAlt || content.title,
        siteUrl,
        credentials
      );
    } catch (error) {
      console.error("Failed to upload featured image:", error);
      // Continue without featured image
    }
  }

  // Create the post
  const postData: any = {
    title: content.title,
    content: content.content,
    status: "publish",
    slug: content.slug || undefined,
    excerpt: content.excerpt || undefined,
    meta: {
      _yoast_wpseo_metadesc: content.metaDescription,
      _yoast_wpseo_focuskw: content.focusKeyword,
    },
  };

  if (featuredMediaId) {
    postData.featured_media = featuredMediaId;
  }

  // Add categories if provided
  if (content.categories?.length > 0) {
    const categoryIds = await getOrCreateCategories(content.categories, siteUrl, credentials);
    postData.categories = categoryIds;
  }

  // Add tags if provided
  if (content.tags?.length > 0) {
    const tagIds = await getOrCreateTags(content.tags, siteUrl, credentials);
    postData.tags = tagIds;
  }

  const response = await fetch(`${siteUrl}/wp-json/wp/v2/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${credentials}`,
    },
    body: JSON.stringify(postData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`WordPress API error: ${error}`);
  }

  const post = await response.json();
  
  return {
    postId: post.id,
    url: post.link,
  };
}

// Publish via our SEO AutoFix plugin
async function publishViaPlugin(
  content: any,
  siteUrl: string,
  apiKey: string
): Promise<{ postId: number; url: string }> {
  const response = await fetch(`${siteUrl}/wp-json/seo-autofix/v1/content/publish`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
    },
    body: JSON.stringify({
      title: content.title,
      content: content.content,
      slug: content.slug,
      excerpt: content.excerpt,
      metaDescription: content.metaDescription,
      focusKeyword: content.focusKeyword,
      categories: content.categories,
      tags: content.tags,
      featuredImageUrl: content.featuredImageUrl,
      featuredImageAlt: content.featuredImageAlt,
      postType: content.postType || "post",
      postStatus: "publish",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Plugin API error: ${error}`);
  }

  const result = await response.json();
  
  return {
    postId: result.postId,
    url: result.url,
  };
}

// Upload media to WordPress
async function uploadMediaToWordPress(
  imageUrl: string,
  altText: string,
  siteUrl: string,
  credentials: string
): Promise<number> {
  // Fetch the image
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error("Failed to fetch image");
  }

  const imageBuffer = await imageResponse.arrayBuffer();
  const contentType = imageResponse.headers.get("content-type") || "image/jpeg";
  const extension = contentType.split("/")[1] || "jpg";
  const filename = `featured-${Date.now()}.${extension}`;

  // Upload to WordPress
  const response = await fetch(`${siteUrl}/wp-json/wp/v2/media`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
    body: imageBuffer,
  });

  if (!response.ok) {
    throw new Error("Failed to upload media to WordPress");
  }

  const media = await response.json();

  // Update alt text
  await fetch(`${siteUrl}/wp-json/wp/v2/media/${media.id}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${credentials}`,
    },
    body: JSON.stringify({
      alt_text: altText,
    }),
  });

  return media.id;
}

// Get or create categories
async function getOrCreateCategories(
  categoryNames: string[],
  siteUrl: string,
  credentials: string
): Promise<number[]> {
  const ids: number[] = [];

  for (const name of categoryNames) {
    // Search for existing category
    const searchResponse = await fetch(
      `${siteUrl}/wp-json/wp/v2/categories?search=${encodeURIComponent(name)}`,
      {
        headers: { Authorization: `Basic ${credentials}` },
      }
    );

    const categories = await searchResponse.json();
    const existing = categories.find(
      (c: any) => c.name.toLowerCase() === name.toLowerCase()
    );

    if (existing) {
      ids.push(existing.id);
    } else {
      // Create new category
      const createResponse = await fetch(`${siteUrl}/wp-json/wp/v2/categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${credentials}`,
        },
        body: JSON.stringify({ name }),
      });

      if (createResponse.ok) {
        const newCategory = await createResponse.json();
        ids.push(newCategory.id);
      }
    }
  }

  return ids;
}

// Get or create tags
async function getOrCreateTags(
  tagNames: string[],
  siteUrl: string,
  credentials: string
): Promise<number[]> {
  const ids: number[] = [];

  for (const name of tagNames) {
    // Search for existing tag
    const searchResponse = await fetch(
      `${siteUrl}/wp-json/wp/v2/tags?search=${encodeURIComponent(name)}`,
      {
        headers: { Authorization: `Basic ${credentials}` },
      }
    );

    const tags = await searchResponse.json();
    const existing = tags.find(
      (t: any) => t.name.toLowerCase() === name.toLowerCase()
    );

    if (existing) {
      ids.push(existing.id);
    } else {
      // Create new tag
      const createResponse = await fetch(`${siteUrl}/wp-json/wp/v2/tags`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${credentials}`,
        },
        body: JSON.stringify({ name }),
      });

      if (createResponse.ok) {
        const newTag = await createResponse.json();
        ids.push(newTag.id);
      }
    }
  }

  return ids;
}

// Also support POST for manual triggering
export async function POST(request: NextRequest) {
  return GET(request);
}
