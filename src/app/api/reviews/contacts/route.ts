import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireAuth();
    const contacts = await prisma.reviewContact.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ contacts });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { contacts } = await request.json();

    if (!contacts?.length) return NextResponse.json({ error: "Contacts required" }, { status: 400 });

    const created = await Promise.all(
      contacts.map(async (c: any) => {
        return prisma.reviewContact.upsert({
          where: { userId_email: { userId: user.id, email: c.email } },
          create: { userId: user.id, email: c.email, name: c.name, phone: c.phone, tags: c.tags || [] },
          update: { name: c.name, phone: c.phone, tags: c.tags || [] },
        });
      })
    );

    return NextResponse.json({ success: true, contacts: created });
  } catch (error) {
    return NextResponse.json({ error: "Failed to add contacts" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await prisma.reviewContact.deleteMany({ where: { id, userId: user.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete contact" }, { status: 500 });
  }
}
