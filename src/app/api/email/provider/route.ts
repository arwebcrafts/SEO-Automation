import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Email provider configuration - uses Resend as primary
export async function GET() {
  try {
    await requireAuth();
    const configured = !!process.env.RESEND_API_KEY;
    return NextResponse.json({
      provider: "resend",
      configured,
      from: process.env.EMAIL_FROM || "notifications@seoaudit.app",
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch provider config" }, { status: 500 });
  }
}
