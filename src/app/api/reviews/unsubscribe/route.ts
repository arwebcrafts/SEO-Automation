import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  try {
    await prisma.reviewContact.updateMany({
      where: { email },
      data: { unsubscribed: true },
    });
    return new NextResponse(
      `<html><body style="font-family:Inter,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f8fafc;"><div style="text-align:center;padding:32px;background:white;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.1);"><h1 style="color:#1e293b;">Unsubscribed</h1><p style="color:#64748b;">You have been successfully unsubscribed from review requests.</p></div></body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  } catch (error) {
    return NextResponse.json({ error: "Failed to unsubscribe" }, { status: 500 });
  }
}
