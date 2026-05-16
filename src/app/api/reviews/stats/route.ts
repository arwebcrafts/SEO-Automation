import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireAuth();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalContacts, totalSent, sentThisMonth, opened, reviewed] = await Promise.all([
      prisma.reviewContact.count({ where: { userId: user.id } }),
      prisma.reviewRequest.count({ where: { userId: user.id } }),
      prisma.reviewRequest.count({ where: { userId: user.id, createdAt: { gte: startOfMonth } } }),
      prisma.reviewRequest.count({ where: { userId: user.id, status: "opened" } }),
      prisma.reviewRequest.count({ where: { userId: user.id, status: "reviewed" } }),
    ]);

    return NextResponse.json({
      stats: {
        totalContacts,
        totalSent,
        sentThisMonth,
        opened,
        reviewed,
        openRate: totalSent > 0 ? Math.round((opened / totalSent) * 100) : 0,
        reviewRate: totalSent > 0 ? Math.round((reviewed / totalSent) * 100) : 0,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
