import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// WordPress configuration - you should store these in environment variables
// For now, we'll use the connection from localStorage for flexibility
let WORDPRESS_URL = process.env.WORDPRESS_URL || "";
let API_KEY = process.env.WORDPRESS_API_KEY || "";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { 
      title,
      content,
      location,
      contentType,
      imageUrl,
      primaryKeywords,
      status = "draft", // Can be 'draft', 'publish', 'pending'
      wordpressConnection // Allow passing WordPress connection details
    } = body;

    // Use provided connection or get from environment
    if (wordpressConnection) {
      WORDPRESS_URL = wordpressConnection.siteUrl;
      API_KEY = wordpressConnection.apiKey;
    }

    // If still not configured, try to get from a default connection method
    if (!WORDPRESS_URL || !API_KEY) {
      // For now, we'll need to pass the connection from the client
      return NextResponse.json(
        { 
          success: false,
          error: "WordPress connection not configured. Please ensure WordPress is properly connected." 
        },
        { status: 400 }
      );
    }

    // Validate image URL
    let processedImageUrl = imageUrl;
    if (imageUrl) {
      // Check if it's a valid URL
      try {
        new URL(imageUrl);
        console.log("[WordPress Publish] Valid image URL provided:", imageUrl);
      } catch (urlError) {
        console.warn("[WordPress Publish] Invalid image URL, removing:", imageUrl);
        processedImageUrl = "";
      }
    }

    if (!title || !content) {
      return NextResponse.json(
        { 
          success: false,
          error: "Title and content are required" 
        },
        { status: 400 }
      );
    }

    console.log("[WordPress Publish] Publishing content:", {
      title,
      location,
      contentType,
      status,
      hasImage: !!imageUrl,
    });

    // Check if WordPress is configured
    if (!WORDPRESS_URL || !API_KEY) {
      return NextResponse.json(
        { 
          success: false,
          error: "WordPress connection not provided. Please ensure WordPress is properly connected." 
        },
        { status: 400 }
      );
    }

    // Call the real WordPress plugin API
    console.log("[WordPress Publish] Sending image URL:", processedImageUrl);
    console.log("[WordPress Publish] Image URL type:", typeof processedImageUrl);
    console.log("[WordPress Publish] Image URL length:", processedImageUrl?.length);
    
    // Prepare the request payload with enhanced image handling
    const requestPayload = {
      title,
      content,
      location,
      contentType,
      status,
      // Enhanced image handling - try multiple approaches
      imageUrl: processedImageUrl?.trim() || "",
      featured_image: processedImageUrl?.trim() || "",
      featuredImageUrl: processedImageUrl?.trim() || "",
      image_url: processedImageUrl?.trim() || "",
      // New fields for better image handling
      media_url: processedImageUrl?.trim() || "",
      thumbnail_url: processedImageUrl?.trim() || "",
      // Explicit instruction to set as featured image
      set_featured_image: !!processedImageUrl,
      download_featured_image: !!processedImageUrl,
      // Image metadata
      primaryKeywords,
      hasImage: !!processedImageUrl,
      imageSource: processedImageUrl ? "ai-generated" : "none",
      imageMetadata: processedImageUrl ? {
        url: processedImageUrl,
        type: "featured",
        source: "ai-generated",
        alt: title || "AI generated image",
        caption: title || "AI generated featured image"
      } : null,
    };
    
    console.log("[WordPress Publish] Request payload keys:", Object.keys(requestPayload));
    console.log("[WordPress Publish] Image fields in payload:", {
      imageUrl: !!requestPayload.imageUrl,
      featured_image: !!requestPayload.featured_image,
      featuredImageUrl: !!requestPayload.featuredImageUrl,
      image_url: !!requestPayload.image_url,
    });
    
    const wordpressResponse = await fetch(`${WORDPRESS_URL}/wp-json/seo-autofix/v1/content/publish`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-SEO-AutoFix-Key": API_KEY,
      },
      body: JSON.stringify(requestPayload),
    });

    console.log("[WordPress Publish] API response status:", wordpressResponse.status);

    if (!wordpressResponse.ok) {
      const errorText = await wordpressResponse.text();
      console.error("[WordPress Publish] API error response:", errorText);
      
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `WordPress API error: ${wordpressResponse.status}`);
      } catch {
        throw new Error(`WordPress API error: ${wordpressResponse.status} - ${errorText}`);
      }
    }

    const responseData = await wordpressResponse.json();
    console.log("[WordPress Publish] Full API response:", JSON.stringify(responseData, null, 2));
    console.log("[WordPress Publish] Post ID:", responseData.post?.id || responseData.postId);
    console.log("[WordPress Publish] Featured media ID:", responseData.post?.featured_media);
    console.log("[WordPress Publish] Response structure:", Object.keys(responseData));

    // Check if image was successfully set as featured image
    // WordPress plugin may return featured_media in different ways
    const featuredMediaId = responseData.post?.featured_media || 
                           responseData.featured_media || 
                           responseData.post?.featured_media_id ||
                           responseData.featured_media_id ||
                           0;
    
    const imageSetSuccessfully = featuredMediaId > 0;
    
    console.log("[WordPress Publish] Image set as featured:", imageSetSuccessfully);
    console.log("[WordPress Publish] Featured media ID:", featuredMediaId);
    
    // If image wasn't set as featured but we have an image URL, try a separate approach
    const postId = responseData.post?.id || responseData.postId;
    if (!imageSetSuccessfully && processedImageUrl && postId) {
      console.log("[WordPress Publish] Trying fallback method to set featured image...");
      
      try {
        // Try to upload the image to media library first, then set as featured
        const mediaResponse = await fetch(`${WORDPRESS_URL}/wp-json/seo-autofix/v1/media/upload`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-SEO-AutoFix-Key": API_KEY,
          },
          body: JSON.stringify({
            image_url: processedImageUrl,
            alt_text: title || "AI generated image",
            caption: title || "AI generated featured image",
            post_id: postId
          }),
        });
        
        if (mediaResponse.ok) {
          const mediaData = await mediaResponse.json();
          console.log("[WordPress Publish] Media upload response:", mediaData);
          
          const mediaId = mediaData.media_id || mediaData.id;
          if (mediaId) {
            // Now set the uploaded media as featured image
            const featuredResponse = await fetch(`${WORDPRESS_URL}/wp-json/seo-autofix/v1/posts/${postId}/featured-image`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-SEO-AutoFix-Key": API_KEY,
              },
              body: JSON.stringify({
                media_id: mediaId
              }),
            });
            
            if (featuredResponse.ok) {
              console.log("[WordPress Publish] Featured image set successfully via fallback method");
              // Update the response data to reflect the successful image setting
              if (responseData.post) {
                responseData.post.featured_media = mediaId;
              }
            } else {
              console.warn("[WordPress Publish] Fallback featured image setting failed:", await featuredResponse.text());
            }
          }
        } else {
          console.warn("[WordPress Publish] Media upload failed:", await mediaResponse.text());
        }
      } catch (fallbackError) {
        console.warn("[WordPress Publish] Fallback method failed:", fallbackError);
      }
    }
    
    // Re-check featured media ID after fallback attempt
    const finalFeaturedMediaId = responseData.post?.featured_media || 
                                   responseData.featured_media || 
                                   responseData.post?.featured_media_id ||
                                   responseData.featured_media_id ||
                                   0;
    
    const finalImageSetSuccessfully = finalFeaturedMediaId > 0;
    
    console.log("[WordPress Publish] Final image set as featured:", finalImageSetSuccessfully);
    console.log("[WordPress Publish] Final featured media ID:", finalFeaturedMediaId);

    // Handle both old and new response formats for backward compatibility
    let postData;
    if (responseData.post) {
      // New format: { success: true, post: { id: 123, ... } }
      postData = responseData.post;
    } else if (responseData.postId) {
      // Old format: { success: true, postId: 123, url: "...", status: "..." }
      postData = {
        id: responseData.postId,
        link: responseData.url,
        status: responseData.status,
        title: { rendered: title || "Published Content" },
        content: { rendered: "" },
        slug: responseData.url?.split('/')?.filter(Boolean)?.pop() || "",
        date: new Date().toISOString(),
        featured_media: finalFeaturedMediaId, // Use the actual featured media ID
        meta: {
          generated_by: "auto-content-engine"
        }
      };
    } else {
      console.error("[WordPress Publish] No post data found in response");
      postData = null;
    }

    // Store successful publish in database
    let dbStored = false;
    try {
      if (prisma && (prisma as any).wordPressPublish) {
        await (prisma as any).wordPressPublish.create({
          data: {
            title: title,
            content: content,
            excerpt: content ? content.substring(0, 200) + "..." : "",
            wordCount: content ? content.split(/\s+/).length : 0,
            wordpressPostId: postData?.id || 0,
            permalink: postData?.link || responseData.url || "",
            wordpressEditUrl: responseData.editUrl || "",
            status: responseData.status || status,
            location: location || "",
            contentType: contentType || "",
            primaryKeywords: primaryKeywords || [],
            imageUrl: imageUrl || "",
            imageDownloaded: !!imageUrl,
            wordpressUrl: WORDPRESS_URL,
            wordpressApiUrl: `${WORDPRESS_URL}/wp-json/seo-autofix/v1/content/publish`,
            userId: user.id,
            publishResponse: responseData,
            publishError: null,
          },
        });
        console.log("[WordPress Publish] Stored in database successfully");
        dbStored = true;
      }
    } catch (dbError) {
      console.error("[WordPress Publish] Database storage error:", dbError);
      // Continue even if database storage fails
    }

    // Format image status message
    const imageStatusMessage = processedImageUrl
      ? finalImageSetSuccessfully
        ? "Image set as featured"
        : "Image sent but not set as featured"
      : "No image included";

    const message = `Content "${title}" published successfully to WordPress! Post ID: ${postData?.id || responseData.postId}\n\nImage Status: ${imageStatusMessage}`;

    return NextResponse.json({
      success: true,
      post: postData,
      message: message,
      postId: postData?.id || responseData.postId,
      imageStatus: {
        sent: !!processedImageUrl,
        setAsFeatured: finalImageSetSuccessfully,
        featuredMediaId: finalFeaturedMediaId,
        originalUrl: processedImageUrl,
        message: imageStatusMessage
      }
    });
  } catch (error) {
    console.error("[WordPress Publish] Error:", error);
    
    // Store failed publish attempt
    try {
      const body = await request.clone().json().catch(() => ({}));
      const currentUser = await requireAuth();
      await (prisma as any).wordPressPublish.create({
        data: {
          title: body.title || "Unknown",
          content: body.content || "",
          wordpressPostId: 0,
          permalink: "",
          status: "failed",
          location: body.location || "",
          contentType: body.contentType || "",
          primaryKeywords: body.primaryKeywords || [],
          imageUrl: body.imageUrl || "",
          imageDownloaded: false,
          wordpressUrl: WORDPRESS_URL,
          wordpressApiUrl: `${WORDPRESS_URL}/wp-json/seo-autofix/v1/content/publish`,
          userId: currentUser.id,
          publishResponse: { error: String(error) },
          publishError: String(error),
        },
      });
    } catch (dbError) {
      console.error("[WordPress Publish] Failed to store error in database:", dbError);
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to publish to WordPress", 
        details: String(error) 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("postId");

    // Call the real WordPress plugin API
    const wordpressUrl = postId 
      ? `${WORDPRESS_URL}/wp-json/seo-autofix/v1/content?postId=${postId}`
      : `${WORDPRESS_URL}/wp-json/seo-autofix/v1/content`;

    const wordpressResponse = await fetch(wordpressUrl, {
      method: "GET",
      headers: {
        "X-SEO-AutoFix-Key": API_KEY,
      },
    });

    if (!wordpressResponse.ok) {
      const errorData = await wordpressResponse.json().catch(() => ({}));
      throw new Error(errorData.error || `WordPress API error: ${wordpressResponse.status}`);
    }

    const responseData = await wordpressResponse.json();

    return NextResponse.json({
      success: true,
      ...(postId ? { post: responseData.post } : { posts: responseData.posts }),
    });
  } catch (error) {
    console.error("[WordPress Publish GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch WordPress data", details: String(error) },
      { status: 500 }
    );
  }
}
