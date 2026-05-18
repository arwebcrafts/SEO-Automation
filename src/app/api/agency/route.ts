import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET: Get agency details
export async function GET() {
  try {
    const user = await requireAuth();

    // Get user's agency (either owned or member of)
    const userWithAgency = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        ownedAgency: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
            clients: {
              include: {
                audits: {
                  orderBy: { createdAt: "desc" },
                  take: 1,
                },
                contentAnalyses: {
                  orderBy: { createdAt: "desc" },
                  take: 1,
                },
              },
            },
            _count: {
              select: {
                members: true,
                clients: true,
              },
            },
          },
        },
        agencyMemberships: {
          where: { status: "ACCEPTED" },
          include: {
            agency: {
              include: {
                members: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        name: true,
                        email: true,
                      },
                    },
                  },
                },
                clients: {
                  include: {
                    audits: {
                      orderBy: { createdAt: "desc" },
                      take: 1,
                    },
                    contentAnalyses: {
                      orderBy: { createdAt: "desc" },
                      take: 1,
                    },
                  },
                },
                _count: {
                  select: {
                    members: true,
                    clients: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const agency = userWithAgency?.ownedAgency || userWithAgency?.agencyMemberships[0]?.agency;
    const membership = userWithAgency?.agencyMemberships[0];

    if (!agency) {
      return NextResponse.json(
        { error: "No agency found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      agency,
      role: userWithAgency?.ownedAgency ? "OWNER" : membership?.role || "MEMBER",
      permissions: userWithAgency?.ownedAgency ? ["all"] : membership?.permissions || [],
    });
  } catch (error: unknown) {
    console.error("Get agency error:", error);
    return NextResponse.json(
      { error: "Failed to get agency" },
      { status: 500 }
    );
  }
}

// PUT: Update agency details
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { name, description, website, logo } = body;

    // Get user's owned agency
    const agency = await prisma.agency.findUnique({
      where: { ownerId: user.id },
    });

    if (!agency) {
      return NextResponse.json(
        { error: "You don't have permission to update this agency" },
        { status: 403 }
      );
    }

    const updatedAgency = await prisma.agency.update({
      where: { id: agency.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(website !== undefined && { website }),
        ...(logo !== undefined && { logo }),
      },
    });

    return NextResponse.json({ success: true, agency: updatedAgency });
  } catch (error: unknown) {
    console.error("Update agency error:", error);
    return NextResponse.json(
      { error: "Failed to update agency" },
      { status: 500 }
    );
  }
}
