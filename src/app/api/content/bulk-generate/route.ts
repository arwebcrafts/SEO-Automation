import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { tasks } from "@trigger.dev/sdk/v3";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { 
      selectedTopics,
      selectedLocations,
      service,
      brandTone,
      targetAudience,
      aboutSummary,
      generateImages = true,
      singlePage = true,
      customPrompt = '',
      scrapedContent = '',
      imageStyle = 'watercolor', // New: watercolor, vivid, natural
      includeYouTube = true, // New: search for related YouTube videos
    } = body;

    if (!selectedTopics || selectedTopics.length === 0) {
      return NextResponse.json(
        { error: "At least one topic must be selected" },
        { status: 400 }
      );
    }

    // Locations are now optional - content can be generated without location targeting
    const locations = selectedLocations && selectedLocations.length > 0 
      ? selectedLocations 
      : [''];

    console.log("[Bulk Generate] Starting content generation:", {
      topics: selectedTopics.length,
      locations: locations.length,
      service,
      singlePage,
      imageStyle,
      includeYouTube,
    });

    // If singlePage is true, only generate one combination (first topic + first location)
    let combinations = [];
    if (singlePage) {
      const topic = selectedTopics[0];
      // Use topic's targetLocations if available, otherwise use selectedLocations
      const topicLocations = topic.targetLocations && topic.targetLocations.length > 0 
        ? topic.targetLocations 
        : locations;
      const location = topicLocations[0] || locations[0] || '';
      
      combinations = [{
        topic,
        location,
        service,
        brandTone,
        targetAudience,
        aboutSummary,
        generateImages,
        customPrompt,
        scrapedContent,
        imageStyle,
        includeYouTube,
      }];
      console.log("[Bulk Generate] Single page mode: generating 1 piece of content for location:", location || '(no location)');
    } else {
      // Create all topic-location combinations (original behavior)
      for (const topic of selectedTopics) {
        const topicLocations = topic.targetLocations && topic.targetLocations.length > 0 
          ? topic.targetLocations 
          : locations;
        
        for (const location of topicLocations) {
          combinations.push({
            topic,
            location,
            service,
            brandTone,
            targetAudience,
            aboutSummary,
            generateImages,
            customPrompt,
            scrapedContent,
            imageStyle,
            includeYouTube,
          });
        }
      }
      console.log("[Bulk Generate] Bulk mode: generating", combinations.length, "pieces of content");
    }

    // Trigger content generation task
    const handle = await tasks.trigger("content-generator", {
      combinations,
      userId: user.id,
      generateImages,
      singlePage,
      imageStyle,
      includeYouTube,
    });

    return NextResponse.json({
      success: true,
      taskId: handle.id,
      totalCombinations: combinations.length,
      message: `Started generating ${combinations.length} piece${combinations.length === 1 ? '' : 's'} of content`,
    });
  } catch (error) {
    console.error("[Bulk Generate] Error:", error);
    return NextResponse.json(
      { error: "Failed to start content generation", details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("taskId");

    if (!taskId) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 }
      );
    }

    console.log("[Bulk Generate GET] Checking status for task:", taskId);

    // Try to get real task results from Trigger.dev
    const realResults = await getTriggerDevTaskResults(taskId);
    
    if (realResults && realResults.needsClientSideMCP) {
      // Return the response indicating MCP should be used
      console.log("[Bulk Generate GET] MCP needed for task:", taskId);
      return NextResponse.json(realResults);
    } else if (realResults) {
      return NextResponse.json(realResults);
    } else {
      // Don't return fallback results here - let the frontend handle MCP
      console.log("[Bulk Generate GET] No results available, letting frontend handle MCP");
      return NextResponse.json({
        success: false,
        needsClientSideMCP: true,
        taskId,
        status: "PENDING",
        progress: 0,
        results: []
      });
    }
  } catch (error) {
    console.error("[Bulk Generate GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to get generation status", details: String(error) },
      { status: 500 }
    );
  }
}

// Helper function to get Trigger.dev task results
async function getTriggerDevTaskResults(taskId: string) {
  try {
    console.log("[Trigger.dev] Getting run results for:", taskId);
    
    // Use Trigger.dev SDK to retrieve the run
    const { runs } = await import("@trigger.dev/sdk/v3");
    const run = await runs.retrieve(taskId);
    
    console.log("[Trigger.dev] Retrieved run:", {
      id: run.id,
      status: run.status,
      isCompleted: run.status === "COMPLETED"
    });
    
    // If the run is completed, return the actual results
    if (run.status === "COMPLETED" && run.output) {
      return {
        success: true,
        status: "COMPLETED",
        progress: 100,
        total: run.output.results?.length || 1,
        completed: run.output.results?.length || 1,
        failed: 0,
        results: run.output.results || [],
        summary: run.output.summary || {
          total: run.output.results?.length || 1,
          completed: run.output.results?.length || 1,
          failed: 0
        }
      };
    } else if (run.status === "FAILED" || run.status === "CRASHED") {
      return {
        success: false,
        status: "FAILED",
        error: run.error || "Task execution failed",
        progress: 0,
        results: []
      };
    } else {
      // Task is still running
      return {
        success: false,
        needsClientSideMCP: false,
        taskId,
        status: run.status,
        progress: run.status === "EXECUTING" ? 50 : 0,
        results: []
      };
    }
    
  } catch (error) {
    console.error("[Trigger.dev] Failed to get run results:", error);
    // If we can't get results, indicate that client-side MCP should be used
    return {
      success: false,
      needsClientSideMCP: true,
      taskId
    };
  }
}

// Fallback function is no longer used - all results come from Trigger.dev
