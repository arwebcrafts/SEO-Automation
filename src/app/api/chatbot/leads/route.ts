import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleApiError } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAuth();
    const leads = await prisma.chatbotLead.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json({ leads });
  } catch (error: unknown) {
    return handleApiError(error, "Failed to fetch leads");
  }
}

export async function POST(request: NextRequest) {
  try {
    const { siteId, name, email, phone, message, source } = await request.json();

    if (!siteId) return NextResponse.json({ error: "Site ID required" }, { status: 400 });

    const lead = await prisma.chatbotLead.create({
      data: { siteId, name, email, phone, message, source },
    });

    return NextResponse.json({ success: true, lead });
  } catch (error: unknown) {
    return handleApiError(error, "Failed to capture lead");
  }
}

