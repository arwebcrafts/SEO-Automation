import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleApiError } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { title, outline, serviceUrl, tone, keywords } = await req.json();

    if (!title || !outline) {
      return NextResponse.json({ error: "Title and outline are required" }, { status: 400 });
    }

    // Get or create a default WordPress site for the user
    let wordpressSite;
    try {
      wordpressSite = await prisma.wordPressSite.findFirst({
        where: { userId: user.id },
      });
    } catch (error: unknown) {
      console.error("[Draft Creation] Error finding WordPress site:", error);
    }

    // If no WordPress site exists, create a default one
    if (!wordpressSite) {
      try {
        wordpressSite = await prisma.wordPressSite.create({
          data: {
            userId: user.id,
            name: "Default Site",
            siteUrl: serviceUrl || "https://example.com",
            apiKey: "placeholder-key",
          },
        });
      } catch (error: unknown) {
        console.error("[Draft Creation] Error creating default WordPress site:", error);
        return handleApiError(error, "Failed to create WordPress site");
      }
    }

    // Create a new draft in the database with userId
    const draft = await prisma.scheduledContent.create({
      data: {
        title,
        outline: typeof outline === 'string' ? outline : JSON.stringify(outline),
        targetServiceUrl: serviceUrl,
        status: "GENERATING",
        postType: "blog",
        scheduledFor: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 7 days from now
        content: "",
        userId: user.id, // Associate with authenticated user
        wordpressSiteId: wordpressSite.id,
        focusKeyword: keywords && keywords.length > 0 ? keywords[0] : title.split(' ').slice(0, 3).join(' '),
        secondaryKeywords: keywords || [],
      },
    });

    console.log("[Draft Creation] Created draft:", { id: draft.id, title: draft.title });

    return NextResponse.json({ 
      success: true, 
      draft: {
        id: draft.id,
        title: draft.title,
        outline: draft.outline,
        serviceUrl: serviceUrl,
        tone,
        keywords,
      }
    });
  } catch (error: unknown) {
    console.error("[Draft Creation] ERROR:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create draft" },
      { status: 500 }
    );
  }
}
