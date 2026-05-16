import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireAuth();
    let settings = await prisma.reviewSettings.findUnique({ where: { userId: user.id } });
    if (!settings) {
      settings = await prisma.reviewSettings.create({ data: { userId: user.id } });
    }
    return NextResponse.json({ settings });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();
    const data = await request.json();
    const settings = await prisma.reviewSettings.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...data },
      update: data,
    });
    return NextResponse.json({ settings });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
