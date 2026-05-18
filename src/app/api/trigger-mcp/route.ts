import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/auth";

export const dynamic = "force-dynamic";

// This endpoint acts as a proxy for MCP server calls
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { action, runId } = body;

    if (action === "getRunDetails") {
      console.log("[Trigger MCP] Getting run details for:", runId);
      
      try {
        // Call the MCP server to get actual run details
        const runDetails = await getRunDetailsFromMCP(runId);
        
        if (runDetails) {
          return NextResponse.json({
            success: true,
            run: runDetails
          });
        } else {
          // If MCP call fails, return error
          return NextResponse.json(
            { error: "Failed to get run details from MCP server" },
            { status: 500 }
          );
        }
      } catch (mcpError) {
        console.error("[Trigger MCP] MCP server error:", mcpError);
        return NextResponse.json(
          { error: "MCP server error", details: String(mcpError) },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );

  } catch (error: unknown) {
    console.error("[Trigger MCP] Error:", error);
    return NextResponse.json(
      { error: "Failed to process MCP request", details: String(error) },
      { status: 500 }
    );
  }
}

// Helper function to get run details from MCP server
async function getRunDetailsFromMCP(runId: string) {
  try {
    // Import MCP server functions
    // Note: The MCP server tools are available as functions in the runtime
    // We need to call them directly to get the actual run details
    
    // Since we're in a Next.js API route, we need to use the Trigger.dev SDK directly
    // The MCP server tools are available to Cascade, but not directly to the API route
    // We'll use the @trigger.dev/sdk to get the run details
    
    const { runs } = await import("@trigger.dev/sdk/v3");
    const run = await runs.retrieve(runId);
    
    console.log("[Trigger MCP] Retrieved run:", {
      id: run.id,
      status: run.status,
      isCompleted: run.status === "COMPLETED"
    });
    
    // Return the run details in the expected format
    return {
      id: run.id,
      status: run.status,
      output: run.output,
      error: run.error,
      createdAt: run.createdAt,
      finishedAt: run.finishedAt
    };
  } catch (error: unknown) {
    console.error("[Trigger MCP] Failed to get run details:", error);
    throw error;
  }
}
