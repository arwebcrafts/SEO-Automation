import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const leads = await prisma.chatbotLead.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json({ leads });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 });
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
  } catch (error) {
    return NextResponse.json({ error: "Failed to capture lead" }, { status: 500 });
  }
}
