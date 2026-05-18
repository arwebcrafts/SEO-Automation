import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/auth";
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
    console.log("[WordPress Publish] ========== IMAGE DEBUG ==========");
    console.log("[WordPress Publish] Raw imageUrl from request:", imageUrl);
    console.log("[WordPress Publish] imageUrl type:", typeof imageUrl);
    
    if (imageUrl) {
      // Check if it's a valid URL
      try {
        new URL(imageUrl);
        console.log("[WordPress Publish] Valid image URL confirmed:", imageUrl);
      } catch (urlError) {
        console.warn("[WordPress Publish] Invalid image URL, removing:", imageUrl);
        processedImageUrl = "";
      }
    } else {
      console.log("[WordPress Publish] No imageUrl provided in request");
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

    // PRE-UPLOAD IMAGE: Download image here (from OpenAI temp URL) and upload to WordPress BEFORE creating post
    // This ensures the image is in WordPress media library with a permanent URL
    let preUploadedMediaId = 0;
    let preUploadedMediaUrl = "";
    
    if (processedImageUrl) {
      console.log("[WordPress Publish] PRE-UPLOADING IMAGE to WordPress first...");
      console.log("[WordPress Publish] Image URL:", processedImageUrl);
      
      try {
        // Step 1: Download image from OpenAI temp URL (from our server, which has access)
        const imageDownloadResponse = await fetch(processedImageUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });
        
        if (!imageDownloadResponse.ok) {
          console.warn("[WordPress Publish] Failed to download image:", imageDownloadResponse.status);
        } else {
          const imageBuffer = await imageDownloadResponse.arrayBuffer();
          const contentType = imageDownloadResponse.headers.get('content-type') || 'image/png';
          
          // Determine file extension
          let fileExt = 'png';
          if (contentType.includes('jpeg') || contentType.includes('jpg')) fileExt = 'jpg';
          else if (contentType.includes('png')) fileExt = 'png';
          else if (contentType.includes('gif')) fileExt = 'gif';
          else if (contentType.includes('webp')) fileExt = 'webp';
          
          // Use a safe filename format that won't be mistaken for phone numbers
          const dateStr = new Date().toISOString().slice(0,10).replace(/-/g, '');
          const randomStr = Math.random().toString(36).substring(2, 8);
          const fileName = `featured-img-${dateStr}-${randomStr}.${fileExt}`;
          console.log("[WordPress Publish] Image downloaded successfully, size:", imageBuffer.byteLength, "bytes");
          
          // Step 2: Upload to WordPress Media Library via REST API
          const mediaUploadResponse = await fetch(`${WORDPRESS_URL}/wp-json/wp/v2/media`, {
            method: "POST",
            headers: {
              "Content-Disposition": `attachment; filename="${fileName}"`,
              "Content-Type": contentType,
              "X-SEO-AutoFix-Key": API_KEY,
            },
            body: Buffer.from(imageBuffer),
          });
          
          console.log("[WordPress Publish] Media upload response status:", mediaUploadResponse.status);
          
          if (mediaUploadResponse.ok) {
            const mediaData = await mediaUploadResponse.json();
            preUploadedMediaId = mediaData.id || 0;
            preUploadedMediaUrl = mediaData.source_url || mediaData.guid?.rendered || "";
            console.log("[WordPress Publish] PRE-UPLOAD SUCCESS! Media ID:", preUploadedMediaId, "URL:", preUploadedMediaUrl);
          } else {
            const mediaErrorText = await mediaUploadResponse.text();
            console.warn("[WordPress Publish] Media upload failed:", mediaErrorText);
            
            // Try using our plugin's upload endpoint instead
            console.log("[WordPress Publish] Trying plugin upload endpoint as fallback...");
            const pluginUploadResponse = await fetch(`${WORDPRESS_URL}/wp-json/seo-autofix/v1/media/upload`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-SEO-AutoFix-Key": API_KEY,
              },
              body: JSON.stringify({
                image_data: Buffer.from(imageBuffer).toString('base64'),
                filename: fileName,
                mime_type: contentType,
                title: title,
              }),
            });
            
            if (pluginUploadResponse.ok) {
              const pluginMediaData = await pluginUploadResponse.json();
              preUploadedMediaId = pluginMediaData.attachment_id || pluginMediaData.id || 0;
              preUploadedMediaUrl = pluginMediaData.url || "";
              console.log("[WordPress Publish] Plugin upload SUCCESS! Media ID:", preUploadedMediaId);
            }
          }
        }
      } catch (preUploadError) {
        console.warn("[WordPress Publish] Pre-upload failed:", preUploadError);
      }
    }
    
    // Replace placeholder in content with pre-uploaded WordPress URL
    let processedContent = content;
    if (preUploadedMediaUrl) {
      // Replace {{WORDPRESS_IMAGE_URL}} placeholder
      processedContent = processedContent.replace(/\{\{WORDPRESS_IMAGE_URL\}\}/g, preUploadedMediaUrl);
      
      // Also replace the temporary OpenAI blob URLs with WordPress URL
      processedContent = processedContent.replace(
        /https:\/\/oaidalleapiprodscus\.blob\.core\.windows\.net\/[^"'\s>]+/g,
        preUploadedMediaUrl
      );
      
      console.log("[WordPress Publish] Replaced placeholders and temp URLs in content with:", preUploadedMediaUrl);
    }

    // Call the real WordPress plugin API
    console.log("[WordPress Publish] Sending to WordPress plugin...");
    
    // Prepare the request payload with enhanced image handling
    const requestPayload = {
      title,
      content: processedContent, // Use content with replaced URLs
      location,
      contentType,
      status,
      // Pre-uploaded media ID (if we successfully uploaded it first)
      preUploadedMediaId: preUploadedMediaId,
      preUploadedMediaUrl: preUploadedMediaUrl,
      // Original image URL as fallback
      imageUrl: preUploadedMediaUrl || processedImageUrl?.trim() || "",
      featured_image: preUploadedMediaUrl || processedImageUrl?.trim() || "",
      featuredImageUrl: preUploadedMediaUrl || processedImageUrl?.trim() || "",
      image_url: preUploadedMediaUrl || processedImageUrl?.trim() || "",
      // New fields for better image handling
      media_url: preUploadedMediaUrl || processedImageUrl?.trim() || "",
      thumbnail_url: preUploadedMediaUrl || processedImageUrl?.trim() || "",
      // Explicit instruction to set as featured image
      set_featured_image: !!(preUploadedMediaId || processedImageUrl),
      download_featured_image: !preUploadedMediaId && !!processedImageUrl, // Only download if not pre-uploaded
      // Image metadata
      primaryKeywords,
      hasImage: !!(preUploadedMediaId || processedImageUrl),
      imageSource: preUploadedMediaId ? "pre-uploaded" : (processedImageUrl ? "ai-generated" : "none"),
      imageMetadata: (preUploadedMediaId || processedImageUrl) ? {
        url: preUploadedMediaUrl || processedImageUrl,
        mediaId: preUploadedMediaId,
        type: "featured",
        source: preUploadedMediaId ? "pre-uploaded" : "ai-generated",
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
    console.log("[WordPress Publish] Plugin version:", responseData.pluginVersion || 'OLD VERSION - NEEDS UPDATE');
    console.log("[WordPress Publish] Post ID:", responseData.post?.id || responseData.postId);
    console.log("[WordPress Publish] Featured media ID:", responseData.post?.featured_media || responseData.featured_media);
    console.log("[WordPress Publish] Response structure:", Object.keys(responseData));
    
    // Warn if old plugin version
    if (!responseData.pluginVersion) {
      console.warn("[WordPress Publish] WARNING: WordPress plugin is outdated! Please update the plugin.");
    }

    // Check if image was successfully set as featured image
    // WordPress plugin now returns imageStatus with detailed info
    const pluginImageStatus = responseData.imageStatus || {};
    const featuredMediaId = responseData.post?.featured_media || 
                           responseData.featured_media || 
                           pluginImageStatus.thumbnailId ||
                           pluginImageStatus.mediaId ||
                           responseData.post?.featured_media_id ||
                           responseData.featured_media_id ||
                           0;
    
    // Check plugin's setAsFeatured flag if available (more reliable)
    const imageSetSuccessfully = pluginImageStatus.setAsFeatured === true || featuredMediaId > 0;
    
    console.log("[WordPress Publish] ========== PLUGIN RESPONSE DEBUG ==========");
    console.log("[WordPress Publish] Plugin version:", responseData.pluginVersion || 'NOT FOUND - OLD VERSION!');
    console.log("[WordPress Publish] Image set as featured:", imageSetSuccessfully);
    console.log("[WordPress Publish] Featured media ID:", featuredMediaId);
    console.log("[WordPress Publish] Plugin image status:", JSON.stringify(pluginImageStatus, null, 2));
    if (pluginImageStatus.steps && Array.isArray(pluginImageStatus.steps)) {
      console.log("[WordPress Publish] ========== STEP-BY-STEP DEBUG ==========");
      pluginImageStatus.steps.forEach((step: string, i: number) => {
        console.log(`[WordPress Publish] ${step}`);
      });
      console.log("[WordPress Publish] ========================================");
    }
    if (pluginImageStatus.error) {
      console.log("[WordPress Publish] Image error from plugin:", pluginImageStatus.error);
    }
    console.log("[WordPress Publish] ==========================================");
    
    // If image wasn't set as featured but we have an image URL, try WordPress standard REST API
    const postId = responseData.post?.id || responseData.postId;
    if (!imageSetSuccessfully && processedImageUrl && postId) {
      console.log("[WordPress Publish] Trying WordPress REST API fallback to set featured image...");
      
      try {
        // Step 1: Download the image from the URL
        console.log("[WordPress Publish] Downloading image from:", processedImageUrl);
        const imageResponse = await fetch(processedImageUrl);
        
        if (!imageResponse.ok) {
          throw new Error(`Failed to download image: ${imageResponse.status}`);
        }
        
        const imageBuffer = await imageResponse.arrayBuffer();
        const contentType = imageResponse.headers.get('content-type') || 'image/png';
        
        // Determine file extension from content type
        let fileExt = 'png';
        if (contentType.includes('jpeg') || contentType.includes('jpg')) fileExt = 'jpg';
        else if (contentType.includes('png')) fileExt = 'png';
        else if (contentType.includes('gif')) fileExt = 'gif';
        else if (contentType.includes('webp')) fileExt = 'webp';
        
        const fileName = `featured-image-${Date.now()}.${fileExt}`;
        console.log("[WordPress Publish] Image downloaded, size:", imageBuffer.byteLength, "bytes, type:", contentType);
        
        // Step 2: Upload to WordPress media library using standard REST API
        // Create authorization header (Basic Auth with API key as password)
        const authHeader = `Basic ${Buffer.from(`api:${API_KEY}`).toString('base64')}`;
        
        const mediaUploadResponse = await fetch(`${WORDPRESS_URL}/wp-json/wp/v2/media`, {
          method: "POST",
          headers: {
            "Content-Disposition": `attachment; filename="${fileName}"`,
            "Content-Type": contentType,
            "Authorization": authHeader,
          },
          body: Buffer.from(imageBuffer),
        });
        
        console.log("[WordPress Publish] Media upload status:", mediaUploadResponse.status);
        
        if (mediaUploadResponse.ok) {
          const mediaData = await mediaUploadResponse.json();
          const mediaId = mediaData.id;
          console.log("[WordPress Publish] Media uploaded successfully, ID:", mediaId);
          
          if (mediaId) {
            // Step 3: Update the post to set featured_media using standard REST API
            const updatePostResponse = await fetch(`${WORDPRESS_URL}/wp-json/wp/v2/posts/${postId}`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": authHeader,
              },
              body: JSON.stringify({
                featured_media: mediaId
              }),
            });
            
            if (updatePostResponse.ok) {
              console.log("[WordPress Publish] Featured image set successfully via WordPress REST API!");
              if (responseData.post) {
                responseData.post.featured_media = mediaId;
              }
              responseData.featured_media = mediaId;
            } else {
              const updateError = await updatePostResponse.text();
              console.warn("[WordPress Publish] Failed to update post with featured_media:", updateError);
              
              // Try using our plugin's simpler endpoint as last resort
              const pluginUpdateResponse = await fetch(`${WORDPRESS_URL}/wp-json/seo-autofix/v1/content/set-featured`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "X-SEO-AutoFix-Key": API_KEY,
                },
                body: JSON.stringify({
                  post_id: postId,
                  media_id: mediaId
                }),
              });
              
              if (pluginUpdateResponse.ok) {
                console.log("[WordPress Publish] Featured image set via plugin fallback");
                if (responseData.post) {
                  responseData.post.featured_media = mediaId;
                }
                responseData.featured_media = mediaId;
              }
            }
          }
        } else {
          const mediaError = await mediaUploadResponse.text();
          console.warn("[WordPress Publish] WordPress media upload failed:", mediaError);
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
    
    // If we have a WordPress image URL from the plugin, update the content to replace placeholders
    const wordpressImageUrl = pluginImageStatus?.wordpressUrl || responseData.imageStatus?.wordpressUrl;
    const postIdForUpdate = responseData.post?.id || responseData.postId;
    
    if (wordpressImageUrl && postIdForUpdate) {
      console.log("[WordPress Publish] Calling content/update to replace placeholders with WordPress URL:", wordpressImageUrl);
      
      try {
        const updateResponse = await fetch(`${WORDPRESS_URL}/wp-json/seo-autofix/v1/content/update`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-SEO-AutoFix-Key": API_KEY,
          },
          body: JSON.stringify({
            post_id: postIdForUpdate,
            wordpress_image_url: wordpressImageUrl,
            replace_temp_urls: true
          }),
        });
        
        if (updateResponse.ok) {
          const updateData = await updateResponse.json();
          console.log("[WordPress Publish] Content update result:", updateData);
        } else {
          console.warn("[WordPress Publish] Content update failed:", updateResponse.status);
        }
      } catch (updateError) {
        console.warn("[WordPress Publish] Content update error:", updateError);
      }
    } else if (postIdForUpdate && !wordpressImageUrl) {
      // Plugin didn't return WordPress URL, try to get it from the media library
      console.log("[WordPress Publish] No WordPress image URL returned, checking if we need to update content anyway...");
    }

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

    // Get plugin's image status for detailed error info
    const pluginImageError = pluginImageStatus?.error || '';
    
    // Format image status message
    let imageStatusMessage = "No image included";
    if (processedImageUrl) {
      if (finalImageSetSuccessfully) {
        imageStatusMessage = "Image set as featured";
      } else if (pluginImageError) {
        imageStatusMessage = `Image failed: ${pluginImageError}`;
      } else {
        imageStatusMessage = "Image sent but not set as featured";
      }
    }

    console.log("[WordPress Publish] Final image status message:", imageStatusMessage);
    
    // CRITICAL FIX: If plugin didn't return imageStatus, call the content/update endpoint to fix placeholders
    const postIdToFix = responseData.post?.id || responseData.postId;
    if (postIdToFix && Object.keys(pluginImageStatus).length === 0) {
      console.log("[WordPress Publish] Plugin imageStatus is empty - attempting content update to fix placeholders...");
      
      try {
        // Try to call the content/update endpoint to replace placeholders with any recent image
        const updateFixResponse = await fetch(`${WORDPRESS_URL}/wp-json/seo-autofix/v1/content/update`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-SEO-AutoFix-Key": API_KEY,
          },
          body: JSON.stringify({
            post_id: postIdToFix,
            replace_temp_urls: true,
            use_recent_image: true  // Flag to use most recent image if no specific URL provided
          }),
        });
        
        if (updateFixResponse.ok) {
          const updateFixData = await updateFixResponse.json();
          console.log("[WordPress Publish] Content update fix result:", updateFixData);
        } else {
          console.warn("[WordPress Publish] Content update fix failed:", updateFixResponse.status);
        }
      } catch (updateFixError) {
        console.warn("[WordPress Publish] Content update fix error:", updateFixError);
      }
    }

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
        pluginStatus: pluginImageStatus,
        message: imageStatusMessage
      }
    });
  } catch (error: unknown) {
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
  } catch (error: unknown) {
    console.error("[WordPress Publish GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch WordPress data", details: String(error) },
      { status: 500 }
    );
  }
}
