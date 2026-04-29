import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPlanLimits, hasActiveSubscription } from "@/lib/plan-limits";

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

// GET: List all users with stats
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const accountType = searchParams.get("accountType");

    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
      ];
    }

    if (accountType && ["INDIVIDUAL", "AGENCY"].includes(accountType)) {
      whereClause.accountType = accountType;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: {
              audits: true,
              contentAnalyses: true,
              scheduledContent: true,
              activities: true,
            },
          },
          ownedAgency: {
            select: {
              id: true,
              name: true,
              _count: {
                select: {
                  clients: true,
                  members: true,
                },
              },
            },
          },
        },
      }),
      prisma.user.count({ where: whereClause }),
    ]);

    // Get summary stats
    const [totalUsers, totalAgencies, totalAudits, totalContent, recentActivities] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { accountType: "AGENCY" } }),
      prisma.audit.count(),
      prisma.contentAnalysis.count(),
      prisma.userActivity.count({ where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
    ]);

    return NextResponse.json({
      users: users.map((user) => {
        const limits = getPlanLimits(user);
        return {
        id: user.id,
        email: user.email,
        name: user.name,
        accountType: user.accountType,
        role: user.role,
        plan: user.plan,
        onboardingCompleted: user.onboardingCompleted,
        createdAt: user.createdAt,
        stripeCustomerId: user.stripeCustomerId,
        stripeSubscriptionId: user.stripeSubscriptionId,
        stripeCurrentPeriodEnd: user.stripeCurrentPeriodEnd,
        subscriptionActive: hasActiveSubscription(user),
        usesByok: Boolean(user.openaiApiKeyEncrypted),
        platformAiIncluded: limits.platformAiIncluded,
        stats: {
          audits: user._count.audits,
          contentAnalyses: user._count.contentAnalyses,
          scheduledContent: user._count.scheduledContent,
          activities: user._count.activities,
        },
        agency: user.ownedAgency
          ? {
              id: user.ownedAgency.id,
              name: user.ownedAgency.name,
              clients: user.ownedAgency._count.clients,
              members: user.ownedAgency._count.members,
            }
          : null,
      };
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        totalUsers,
        totalAgencies,
        totalIndividuals: totalUsers - totalAgencies,
        totalAudits,
        totalContent,
        recentActivities,
      },
    });
  } catch (error: any) {
    console.error("Admin get users error:", error);
    if (error.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Failed to get users" },
      { status: 500 }
    );
  }
}
