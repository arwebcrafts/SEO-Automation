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

// GET: Get specific user details with all data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await requireAdmin();
    const { userId } = await params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        audits: {
          take: 10,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            url: true,
            domain: true,
            status: true,
            overallScore: true,
            overallGrade: true,
            createdAt: true,
          },
        },
        contentAnalyses: {
          take: 10,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            domain: true,
            status: true,
            pagesAnalyzed: true,
            createdAt: true,
          },
        },
        scheduledContent: {
          take: 10,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            title: true,
            status: true,
            scheduledFor: true,
            createdAt: true,
          },
        },
        activities: {
          take: 20,
          orderBy: { createdAt: "desc" },
        },
        ownedAgency: {
          include: {
            clients: {
              select: {
                id: true,
                name: true,
                company: true,
                status: true,
                createdAt: true,
              },
            },
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        agencyMemberships: {
          include: {
            agency: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            audits: true,
            contentAnalyses: true,
            scheduledContent: true,
            activities: true,
            wordpressPublishes: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        accountType: user.accountType,
        role: user.role,
        plan: user.plan,
        onboardingCompleted: user.onboardingCompleted,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      stats: user._count,
      audits: user.audits,
      contentAnalyses: user.contentAnalyses,
      scheduledContent: user.scheduledContent,
      activities: user.activities,
      agency: user.ownedAgency,
      agencyMemberships: user.agencyMemberships,
    });
  } catch (error: any) {
    console.error("Admin get user details error:", error);
    if (error.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Failed to get user details" },
      { status: 500 }
    );
  }
}
