import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ siteId: string }> }) {
  try {
    const { siteId } = await params;
    const config = await prisma.chatbotConfig.findUnique({ where: { siteId } });

    if (!config || !config.isActive) {
      return NextResponse.json({ error: "Chatbot not configured" }, { status: 404 });
    }

    // Return public config only (no system prompt)
    return NextResponse.json({
      siteId: config.siteId,
      welcomeMessage: config.welcomeMessage,
      primaryColor: config.primaryColor,
      position: config.position,
      collectEmail: config.collectEmail,
      collectPhone: config.collectPhone,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch config" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ siteId: string }> }) {
  try {
    const { siteId } = await params;
    const data = await request.json();

    const config = await prisma.chatbotConfig.upsert({
      where: { siteId },
      create: { siteId, userId: data.userId, ...data },
      update: data,
    });

    return NextResponse.json({ config });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update config" }, { status: 500 });
  }
}
