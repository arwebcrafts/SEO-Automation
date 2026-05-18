import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/auth";

export const dynamic = "force-dynamic";

// This endpoint will use the MCP server to get Trigger.dev results
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

    console.log("[Trigger Results] Getting results for task:", taskId);

    // Since we can't directly use MCP server in API routes,
    // we'll return a response that indicates the client should handle this
    // The frontend will need to make the MCP call directly
    
    return NextResponse.json({
      success: false,
      error: "Direct MCP access not available in API routes. Use client-side MCP calls.",
      needsClientSideMCP: true,
      taskId
    });

  } catch (error: unknown) {
    console.error("[Trigger Results] Error:", error);
    return NextResponse.json(
      { error: "Failed to get trigger results", details: String(error) },
      { status: 500 }
    );
  }
}
