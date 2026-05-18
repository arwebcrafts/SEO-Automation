import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleApiError } from "@/lib/auth";


export const dynamic = "force-dynamic";



export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const body = await request.json();
    const { siteUrl, apiKey, wpUsername, wpAppPassword } = body;

    if (!siteUrl || !apiKey) {
      return NextResponse.json(
        { error: "siteUrl and apiKey are required" },
        { status: 400 }
      );
    }

    // Normalize site URL
    const normalizedUrl = siteUrl.replace(/\/$/, "");

    // Test SEO AutoFix Plugin API connection
    const pluginValidation = await validatePluginConnection(normalizedUrl, apiKey);

    // Test WordPress REST API connection (if credentials provided)
    const wpValidation = wpUsername && wpAppPassword
      ? await validateWordPressConnection(normalizedUrl, wpUsername, wpAppPassword)
      : null;

    // Compile validation results
    const validationResults = {
      plugin: pluginValidation,
      wordpress: wpValidation,
      overall: {
        isValid: pluginValidation.isValid && (!wpValidation || wpValidation.isValid),
        errors: [
          ...pluginValidation.errors,
          ...(wpValidation?.errors || []),
        ],
        warnings: [
          ...pluginValidation.warnings,
          ...(wpValidation?.warnings || []),
        ],
      },
    };

    return NextResponse.json(
      {
        success: true,
        validation: validationResults,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    return handleApiError(error, "Failed to validate site connection");
  }
}

async function validatePluginConnection(siteUrl: string, apiKey: string) {
  const errors: string[] = [];
  const warnings: string[] = [];
  let isValid = false;

  try {
    // Test ping endpoint
    const pingResponse = await fetch(`${siteUrl}/wp-json/seo-autofix/v1/ping`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!pingResponse.ok) {
      errors.push("Plugin ping endpoint not responding");
      return { isValid: false, errors, warnings, details: null };
    }

    const pingData = await pingResponse.json();
    if (!pingData.pong) {
      errors.push("Plugin ping failed");
      return { isValid: false, errors, warnings, details: null };
    }

    // Test verify endpoint with API key
    const verifyResponse = await fetch(`${siteUrl}/wp-json/seo-autofix/v1/verify`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-SEO-AutoFix-Key": apiKey,
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!verifyResponse.ok) {
      if (verifyResponse.status === 401) {
        errors.push("Invalid API key");
      } else if (verifyResponse.status === 403) {
        errors.push("Remote API is disabled in plugin settings");
      } else {
        errors.push(`Plugin verify endpoint returned ${verifyResponse.status}`);
      }
      return { isValid: false, errors, warnings, details: null };
    }

    const verifyData = await verifyResponse.json();
    if (!verifyData.success) {
      errors.push("Plugin verification failed");
      return { isValid: false, errors, warnings, details: null };
    }

    // Test status endpoint
    const statusResponse = await fetch(`${siteUrl}/wp-json/seo-autofix/v1/status`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-SEO-AutoFix-Key": apiKey,
      },
      signal: AbortSignal.timeout(10000),
    });

    let statusData = null;
    if (statusResponse.ok) {
      statusData = await statusResponse.json();
    } else {
      warnings.push("Could not fetch plugin status");
    }

    isValid = true;

    // Check for warnings
    if (!verifyData.features?.https) {
      warnings.push("Site is not using HTTPS");
    }
    if (!verifyData.features?.gd_library) {
      warnings.push("GD library not available for image processing");
    }
    if (!verifyData.features?.webp_support) {
      warnings.push("WebP support not available");
    }

    return {
      isValid,
      errors,
      warnings,
      details: {
        pluginVersion: verifyData.version,
        wordpressVersion: verifyData.wordpress,
        phpVersion: verifyData.php,
        siteName: verifyData.name,
        siteUrl: verifyData.site,
        stats: statusData?.stats || null,
        features: verifyData.features || null,
      },
    };
  } catch (error: unknown) {
    errors.push(`Connection error: ${error instanceof Error ? error.message : "Unknown error"}`);
    return { isValid: false, errors, warnings, details: null };
  }
}

async function validateWordPressConnection(siteUrl: string, username: string, appPassword: string) {
  const errors: string[] = [];
  const warnings: string[] = [];
  let isValid = false;

  try {
    // Test WordPress REST API
    const auth = btoa(`${username}:${appPassword}`);

    // Test posts endpoint
    const postsResponse = await fetch(`${siteUrl}/wp-json/wp/v2/posts?per_page=1`, {
      method: "GET",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!postsResponse.ok) {
      if (postsResponse.status === 401) {
        errors.push("Invalid WordPress credentials");
      } else if (postsResponse.status === 403) {
        errors.push("User does not have permission to access posts");
      } else {
        errors.push(`WordPress API returned ${postsResponse.status}`);
      }
      return { isValid: false, errors, warnings, details: null };
    }

    // Test categories endpoint
    const categoriesResponse = await fetch(`${siteUrl}/wp-json/wp/v2/categories`, {
      method: "GET",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!categoriesResponse.ok) {
      warnings.push("Could not access categories endpoint");
    }

    // Test tags endpoint
    const tagsResponse = await fetch(`${siteUrl}/wp-json/wp/v2/tags`, {
      method: "GET",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!tagsResponse.ok) {
      warnings.push("Could not access tags endpoint");
    }

    isValid = true;

    return {
      isValid,
      errors,
      warnings,
      details: {
        canAccessPosts: true,
        canAccessCategories: categoriesResponse.ok,
        canAccessTags: tagsResponse.ok,
      },
    };
  } catch (error: unknown) {
    errors.push(`WordPress connection error: ${error instanceof Error ? error.message : "Unknown error"}`);
    return { isValid: false, errors, warnings, details: null };
  }
}
