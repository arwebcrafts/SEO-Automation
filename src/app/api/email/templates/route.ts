import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireAuth();
    const templates = await prisma.emailTemplate.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ templates });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { name, subject, htmlContent, textContent, category, variables } = await request.json();

    if (!name || !subject || !htmlContent) {
      return NextResponse.json({ error: "Name, subject, and HTML content required" }, { status: 400 });
    }

    const template = await prisma.emailTemplate.create({
      data: { userId: user.id, name, subject, htmlContent, textContent, category, variables: variables || [] },
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { id, ...data } = await request.json();

    const template = await prisma.emailTemplate.updateMany({
      where: { id, userId: user.id },
      data,
    });

    return NextResponse.json({ success: true, template });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update template" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await prisma.emailTemplate.deleteMany({ where: { id, userId: user.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete template" }, { status: 500 });
  }
}
