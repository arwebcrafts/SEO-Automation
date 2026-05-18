import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireAuth();
    const campaigns = await prisma.dripCampaign.findMany({
      where: { userId: user.id },
      include: { steps: { orderBy: { stepOrder: "asc" } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ campaigns });
  } catch (error: unknown) {
    return handleApiError(error, "Failed to fetch campaigns");
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { name, description, trigger, steps } = await request.json();

    if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

    const campaign = await prisma.dripCampaign.create({
      data: {
        userId: user.id,
        name,
        description,
        trigger: trigger || "manual",
        steps: {
          create: (steps || []).map((s: any, i: number) => ({
            stepOrder: i + 1,
            delayMinutes: s.delayMinutes || 0,
            subject: s.subject || "",
            htmlContent: s.htmlContent || "",
          })),
        },
      },
      include: { steps: true },
    });

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error: unknown) {
    return handleApiError(error, "Failed to create campaign");
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { id, status, ...data } = await request.json();

    if (!id) return NextResponse.json({ error: "Campaign ID required" }, { status: 400 });

    const campaign = await prisma.dripCampaign.updateMany({
      where: { id, userId: user.id },
      data: { ...data, ...(status && { status }) },
    });

    return NextResponse.json({ success: true, campaign });
  } catch (error: unknown) {
    return handleApiError(error, "Failed to update campaign");
  }
}
