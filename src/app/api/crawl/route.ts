import { NextRequest, NextResponse } from "next/server";
import { tasks, auth, runs, configure } from "@trigger.dev/sdk/v3";
import type { siteCrawlerTask } from "../../../../trigger/crawl/site-crawler";
import { getRunOutput } from "@/lib/trigger-utils";
import { requireAuth, handleApiError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // Allow up to 5 minutes for the GET endpoint

// CRITICAL: Configure SDK with secret key at module level
// The SDK will automatically use TRIGGER_SECRET_KEY if set, but we configure explicitly
// Do NOT call configure() inside handlers as it causes conflicts in warm serverless functions
if (process.env.TRIGGER_SECRET_KEY) {
  configure({ secretKey: process.env.TRIGGER_SECRET_KEY });
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log(`[Crawl POST] Starting request at ${new Date().toISOString()}`);
  
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { url, maxPages = 50 } = body;

    console.log(`[Crawl POST] Body received:`, { url, maxPages });

    if (!url) {
      console.log(`[Crawl POST] Error: URL is required`);
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    // Validate URL
    try {
      new URL(url);
      console.log(`[Crawl POST] URL validated: ${url}`);
    } catch (error: unknown) {
      console.log(`[Crawl POST] Error: Invalid URL format - ${error}`);
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    if (!process.env.TRIGGER_SECRET_KEY) {
      console.error(`[Crawl POST] TRIGGER_SECRET_KEY is not configured`);
      return NextResponse.json(
        { error: "Trigger.dev is not configured. Please add TRIGGER_SECRET_KEY to your environment variables." },
        { status: 500 }
      );
    }

    // Extract domain from URL
    const domain = new URL(url).hostname;

    // Save crawl request to database
    let crawlRequest;
    try {
      crawlRequest = await prisma.crawlRequest.create({
        data: {
          url,
          domain,
          maxPages,
          status: "PENDING",
          userId: user.id,
        },
      });
      console.log(`[Crawl POST] Crawl request saved to database: ${crawlRequest.id}`);
    } catch (dbError) {
      console.error(`[Crawl POST] Failed to save crawl request:`, dbError);
      // Continue with Trigger.dev even if DB save fails
    }

    // Trigger the crawl task (SDK is already configured at module level)
    console.log(`[Crawl POST] Triggering site-crawler task...`);
    const handle = await tasks.trigger<typeof siteCrawlerTask>(
      "site-crawler",
      { url, maxPages }
    );
    console.log(`[Crawl POST] Task triggered successfully. runId: ${handle.id}`);

    // Update crawl request with Trigger.dev run ID
    if (crawlRequest) {
      try {
        await prisma.crawlRequest.update({
          where: { id: crawlRequest.id },
          data: {
            triggerRunId: handle.id,
            status: "RUNNING",
          },
        });
      } catch (updateError) {
        console.error(`[Crawl POST] Failed to update crawl request:`, updateError);
      }
    }

    // Generate a public access token for frontend polling
    console.log(`[Crawl POST] Creating public token...`);
    const publicToken = await auth.createPublicToken({
      scopes: {
        read: {
          runs: [handle.id],
        },
      },
      expirationTime: "1h",
    });
    console.log(`[Crawl POST] Public token created. Length: ${publicToken.length}`);

    // Update crawl request with public token
    if (crawlRequest) {
      try {
        await prisma.crawlRequest.update({
          where: { id: crawlRequest.id },
          data: { publicToken },
        });
      } catch (updateError) {
        console.error(`[Crawl POST] Failed to update crawl request with token:`, updateError);
      }
    }

    const response = {
      runId: handle.id,
      publicToken,
      crawlRequestId: crawlRequest?.id,
      message: "Crawl started",
    };
    
    const elapsed = Date.now() - startTime;
    console.log(`[Crawl POST] Request completed in ${elapsed}ms. Response:`, { ...response, publicToken: `${publicToken.substring(0, 10)}...` });

    return NextResponse.json(response);
  } catch (error: unknown) {
    const elapsed = Date.now() - startTime;
    console.error(`[Crawl POST] Error after ${elapsed}ms:`, error);
    return NextResponse.json(
      { error: "Failed to start crawl. Is Trigger.dev configured?", details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const runId = request.nextUrl.searchParams.get("runId");
  
  console.log(`[Crawl GET] Starting request at ${new Date().toISOString()}`);
  console.log(`[Crawl GET] runId: ${runId}`);
  
  if (!runId) {
    console.log(`[Crawl GET] Error: runId is required`);
    return NextResponse.json(
      { error: "runId is required" },
      { status: 400 }
    );
  }

  try {
    console.log(`[Crawl GET] Retrieving run...`);
    // SDK is already configured at module level with secret key
    const run = await runs.retrieve(runId);
    console.log(`[Crawl GET] Run retrieved. Status: ${run.status}`);

    // Extract metadata properly
    const metadata = run.metadata as any;
    const statusData = metadata?.status || {};
    console.log(`[Crawl GET] Metadata extracted. statusData:`, statusData);

    // Get output, handling offloaded outputs
    let output = null;
    if (run.status === "COMPLETED") {
      try {
        output = await getRunOutput(runId);
      } catch (error: unknown) {
        console.error("Error fetching output:", error);
      }
    }

    const elapsed = Date.now() - startTime;
    console.log(`[Crawl GET] Request completed in ${elapsed}ms`);

    return NextResponse.json({
      status: run.status,
      output,
      metadata: {
        status: statusData,
      },
    });
  } catch (error: unknown) {
    const elapsed = Date.now() - startTime;
    console.error(`[Crawl GET] Error after ${elapsed}ms:`, error);
    return NextResponse.json(
      { error: "Failed to fetch run status", details: String(error) },
      { status: 500 }
    );
  }
}
