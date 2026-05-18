import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { source, data } = await request.json();

    // Import reviews from CSV or other sources
    if (!data?.length) return NextResponse.json({ error: "Data required" }, { status: 400 });

    const imported = await Promise.all(
      data.map(async (item: any) => {
        return prisma.reviewContact.upsert({
          where: { userId_email: { userId: user.id, email: item.email } },
          create: { userId: user.id, email: item.email, name: item.name || "", phone: item.phone, tags: [source || "import"] },
          update: { name: item.name || undefined, phone: item.phone || undefined },
        });
      })
    );

    return NextResponse.json({ success: true, imported: imported.length, source });
  } catch (error: unknown) {
    return handleApiError(error, "Failed to import reviews");
  }
}
