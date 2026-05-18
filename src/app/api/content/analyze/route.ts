import { NextRequest, NextResponse } from "next/server";
import { tasks, configure, runs } from "@trigger.dev/sdk/v3";
import type { contentExtractorTask } from "@/trigger/content/content-extractor";
import type { contentAnalyzerTask } from "@/trigger/content/content-analyzer";
import { getRunOutput } from "@/lib/trigger-utils";
import { requireAuth, handleApiError } from "@/lib/auth";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// CRITICAL: Configure SDK with secret key at module level
// This ensures all SDK operations use the secret key by default
// Do NOT call configure() inside handlers as it causes conflicts in warm serverless functions
if (process.env.TRIGGER_SECRET_KEY) {
  configure({ secretKey: process.env.TRIGGER_SECRET_KEY });
}

export async function POST(request: NextRequest) {
  try {
    console.log("[Analyze POST] Starting request");
    
    // Get authenticated user
    const user = await requireAuth();
    
    const body = await request.json();
    const { baseUrl, pages, maxPages = 50, targetAudience, crawlRequestId } = body;

    if (!baseUrl || !pages) {
      return NextResponse.json(
        { error: "Missing required fields: baseUrl and pages" },
        { status: 400 }
      );
    }

    if (!process.env.TRIGGER_SECRET_KEY) {
      console.error("[Analyze POST] TRIGGER_SECRET_KEY is not configured");
      return NextResponse.json(
        { error: "Trigger.dev is not configured. Please add TRIGGER_SECRET_KEY to your environment variables." },
        { status: 500 }
      );
    }

    // Create content analysis record in Prisma
    const domain = new URL(baseUrl).hostname;
    const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const contentAnalysis = await prisma.contentAnalysis.create({
      data: {
        id: analysisId,
        baseUrl,
        domain,
        status: "RUNNING",
        pagesAnalyzed: pages.length,
        userId: user.id,
        ...(crawlRequestId && { crawlRequestId }),
      },
    });

    console.log(`[Content Analysis] Created analysis record ${contentAnalysis.id} for user ${user.id}`);

    console.log("[Analyze POST] Triggering content extraction task...");

    // Step 1: Extract content from pages
    const extractionHandle = await tasks.trigger<typeof contentExtractorTask>(
      "content-extractor",
      {
        baseUrl,
        pages,
        maxPages,
        extractContent: true,
        analysisId,
        userId: user.id,
      }
    );

    if (!extractionHandle || !extractionHandle.id) {
      throw new Error("Failed to start content extraction task");
    }

    // Step 2: Perform AI analysis with extracted pages (will wait for extraction to complete in the task itself)
    const analysisHandle = await tasks.trigger<typeof contentAnalyzerTask>(
      "content-analyzer",
      {
        baseUrl,
        targetAudience,
        extractionRunId: extractionHandle.id,
        analysisId,
        userId: user.id,
      }
    );

    if (!analysisHandle || !analysisHandle.id) {
      throw new Error("Failed to start content analysis task");
    }

    console.log("Content analysis started:", {
      extractionRunId: extractionHandle.id,
      analysisRunId: analysisHandle.id,
    });

    return NextResponse.json({
      success: true,
      analysisId,
      extractionRunId: extractionHandle.id,
      analysisRunId: analysisHandle.id,
      message: "Content analysis started successfully",
    });
  } catch (error: unknown) {
    console.error("Error in content analysis:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to start content analysis";
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const user = await requireAuth();

  const searchParams = request.nextUrl.searchParams;
  const extractionRunId = searchParams.get("extractionRunId");
  const analysisRunId = searchParams.get("analysisRunId");
  const analysisId = searchParams.get("analysisId");

  if (!extractionRunId || !analysisRunId) {
    return NextResponse.json(
      { error: "Missing extractionRunId or analysisRunId" },
      { status: 400 }
    );
  }

  try {
    console.log("[Analyze GET] Retrieving run status...");

    // Get extraction run status using the secret key (configured at module level)
    let extractionStatus = "PENDING";
    let extractionOutput = null;
    let extractionError = null;

    try {
      const extractionRun = await runs.retrieve(extractionRunId);
      extractionStatus = extractionRun.status;
      
      if (extractionRun.status === "COMPLETED") {
        extractionOutput = await getRunOutput(extractionRunId);
      } else if (extractionRun.status === "FAILED") {
        extractionError = (extractionRun as any).error?.message || "Extraction failed";
      }
    } catch (error: unknown) {
      console.error("Error fetching extraction run:", error);
      extractionStatus = "ERROR";
      extractionError = error instanceof Error ? error.message : "Unknown error";
    }

    // Get analysis run status
    let analysisStatus = "PENDING";
    let analysisOutput = null;
    let analysisError = null;

    try {
      const analysisRun = await runs.retrieve(analysisRunId);
      analysisStatus = analysisRun.status;
      
      if (analysisRun.status === "COMPLETED") {
        analysisOutput = await getRunOutput(analysisRunId);
      } else if (analysisRun.status === "FAILED") {
        analysisError = (analysisRun as any).error?.message || "Analysis failed";
      }
    } catch (error: unknown) {
      console.error("Error fetching analysis run:", error);
      analysisStatus = "ERROR";
      analysisError = error instanceof Error ? error.message : "Unknown error";
    }

    const isComplete = extractionStatus === "COMPLETED" && analysisStatus === "COMPLETED";
    const hasFailed =
      extractionStatus === "FAILED" ||
      analysisStatus === "FAILED" ||
      extractionStatus === "ERROR" ||
      analysisStatus === "ERROR";

    // Persist result into Prisma when we know which record to update
    if (analysisId) {
      try {
        if (isComplete && analysisOutput) {
          const output: any = analysisOutput;
          await prisma.contentAnalysis.updateMany({
            where: {
              id: analysisId,
              userId: user.id,
            },
            data: {
              status: "COMPLETED",
              analysisOutput: output,
              dominantKeywords: output?.contentContext?.dominantKeywords ?? null,
              contentGaps: output?.contentContext?.contentGaps ?? null,
              audiencePersona: output?.contentContext?.audiencePersona ?? null,
              tone: output?.contentContext?.tone ?? null,
              aiSuggestions: output?.aiSuggestions ?? null,
              pagesAnalyzed: Array.isArray(output?.pages) ? output.pages.length : undefined,
              completedAt: new Date(),
            },
          });
        } else if (hasFailed) {
          await prisma.contentAnalysis.updateMany({
            where: {
              id: analysisId,
              userId: user.id,
            },
            data: {
              status: "FAILED",
              completedAt: new Date(),
            },
          });
        }
      } catch (dbError) {
        console.error("[Analyze GET] Failed to persist analysis:", dbError);
      }
    }

    return NextResponse.json({
      extractionStatus,
      extractionOutput,
      extractionError,
      analysisStatus,
      analysisOutput,
      analysisError,
      isComplete,
      hasFailed,
    });
  } catch (error: unknown) {
    console.error("Error fetching analysis status:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch analysis status",
        details: error instanceof Error ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
