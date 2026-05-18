import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const ADMIN_EMAIL = "mwaqarsikandar@gmail.com";

// Check if user is admin
async function requireAdmin() {
  const user = await requireAuth();
  
  const userData = await prisma.user.findUnique({
    where: { id: user.id },
  });

  if (!userData || (userData.email !== ADMIN_EMAIL && userData.role !== "ADMIN")) {
    throw new Error("Unauthorized: Admin access required");
  }

  return userData;
}

// GET: List all activities
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const userId = searchParams.get("userId");
    const action = searchParams.get("action");
    const period = searchParams.get("period") || "7d"; // 1d, 7d, 30d, all

    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (userId) {
      whereClause.userId = userId;
    }

    if (action) {
      whereClause.action = action;
    }

    // Period filter
    if (period !== "all") {
      const days = parseInt(period.replace("d", ""));
      whereClause.createdAt = {
        gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      };
    }

    const [activities, total] = await Promise.all([
      prisma.userActivity.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              accountType: true,
            },
          },
        },
      }),
      prisma.userActivity.count({ where: whereClause }),
    ]);

    // Get activity stats by action type
    const actionStats = await prisma.userActivity.groupBy({
      by: ["action"],
      where: whereClause,
      _count: { action: true },
    });

    // Get daily activity count for the period
    let dailyStats: any[] = [];
    try {
      dailyStats = await prisma.$queryRaw`
        SELECT DATE("createdAt") as date, COUNT(*) as count
        FROM "UserActivity"
        WHERE "createdAt" >= NOW() - INTERVAL '7 days'
        GROUP BY DATE("createdAt")
        ORDER BY date DESC
      ` as any[];
    } catch (e) {
      // Fallback if raw query fails
      console.error("Daily stats query failed:", e);
    }

    return NextResponse.json({
      activities: activities.map((activity) => ({
        id: activity.id,
        action: activity.action,
        entityType: activity.entityType,
        entityId: activity.entityId,
        description: activity.description,
        metadata: activity.metadata,
        clientId: activity.clientId,
        createdAt: activity.createdAt,
        user: activity.user,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        actionBreakdown: actionStats.reduce((acc: any, stat) => {
          acc[stat.action] = stat._count.action;
          return acc;
        }, {}),
        dailyActivity: dailyStats,
      },
    });
  } catch (error: any) {
    console.error("Admin get activities error:", error);
    if (error.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Failed to get activities" },
      { status: 500 }
    );
  }
}
