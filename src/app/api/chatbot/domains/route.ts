import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireAuth();
    const configs = await prisma.chatbotConfig.findMany({ where: { userId: user.id } });
    const domains = configs.map((c) => ({ siteId: c.siteId, domains: c.allowedDomains }));
    return NextResponse.json({ domains });
  } catch (error: unknown) {
    return handleApiError(error, "Failed to fetch domains");
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { siteId, allowedDomains } = await request.json();
    if (!siteId) return NextResponse.json({ error: "Site ID required" }, { status: 400 });

    await prisma.chatbotConfig.updateMany({
      where: { siteId, userId: user.id },
      data: { allowedDomains: allowedDomains || [] },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return handleApiError(error, "Failed to update domains");
  }
}
