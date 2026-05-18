import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Helper to get user's agency with ownership check
async function getUserAgencyWithRole(userId: string) {
  const userWithAgency = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      ownedAgency: true,
      agencyMemberships: {
        where: { status: "ACCEPTED" },
        include: { agency: true },
      },
    },
  });

  const isOwner = !!userWithAgency?.ownedAgency;
  const agency = userWithAgency?.ownedAgency || userWithAgency?.agencyMemberships[0]?.agency;
  const membership = userWithAgency?.agencyMemberships[0];
  const role = isOwner ? "OWNER" : membership?.role || null;

  return { agency, role, isOwner, membership };
}

// GET: List all members
export async function GET() {
  try {
    const user = await requireAuth();
    const { agency } = await getUserAgencyWithRole(user.id);

    if (!agency) {
      return NextResponse.json({ error: "No agency found" }, { status: 404 });
    }

    const members = await prisma.agencyMember.findMany({
      where: { agencyId: agency.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ members });
  } catch (error: unknown) {
    console.error("Get members error:", error);
    return NextResponse.json(
      { error: "Failed to get members" },
      { status: 500 }
    );
  }
}

// POST: Invite new member
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { agency, role, isOwner } = await getUserAgencyWithRole(user.id);

    if (!agency) {
      return NextResponse.json({ error: "No agency found" }, { status: 404 });
    }

    // Only owners and admins can invite members
    if (!isOwner && role !== "ADMIN") {
      return NextResponse.json(
        { error: "You don't have permission to invite members" },
        { status: 403 }
      );
    }

    // Check member limit
    const memberCount = await prisma.agencyMember.count({
      where: { agencyId: agency.id },
    });

    if (memberCount >= agency.maxTeamMembers) {
      return NextResponse.json(
        { error: `Member limit reached (${agency.maxTeamMembers}). Upgrade to add more members.` },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, memberRole = "MEMBER", permissions = [] } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    // Check if user exists
    let invitedUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // If user doesn't exist, we'll create a placeholder (they'll complete signup later)
    if (!invitedUser) {
      // For now, return error - they need to sign up first
      return NextResponse.json(
        { error: "User not found. They need to sign up first before being invited." },
        { status: 404 }
      );
    }

    // Check if already a member
    const existingMembership = await prisma.agencyMember.findUnique({
      where: {
        agencyId_userId: {
          agencyId: agency.id,
          userId: invitedUser.id,
        },
      },
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: "User is already a member of this agency" },
        { status: 400 }
      );
    }

    // Create membership invitation
    const membership = await prisma.agencyMember.create({
      data: {
        agencyId: agency.id,
        userId: invitedUser.id,
        role: memberRole,
        permissions,
        status: "PENDING",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // TODO: Send invitation email

    return NextResponse.json({ success: true, membership });
  } catch (error: unknown) {
    console.error("Invite member error:", error);
    return NextResponse.json(
      { error: "Failed to invite member" },
      { status: 500 }
    );
  }
}

// PUT: Update member role/permissions
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { agency, role, isOwner } = await getUserAgencyWithRole(user.id);

    if (!agency) {
      return NextResponse.json({ error: "No agency found" }, { status: 404 });
    }

    // Only owners and admins can update members
    if (!isOwner && role !== "ADMIN") {
      return NextResponse.json(
        { error: "You don't have permission to update members" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { memberId, memberRole, permissions, status } = body;

    if (!memberId) {
      return NextResponse.json(
        { error: "Member ID is required" },
        { status: 400 }
      );
    }

    // Verify member belongs to agency
    const existingMember = await prisma.agencyMember.findFirst({
      where: { id: memberId, agencyId: agency.id },
    });

    if (!existingMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Can't change owner's role
    if (existingMember.role === "OWNER" && memberRole && memberRole !== "OWNER") {
      return NextResponse.json(
        { error: "Cannot change owner's role" },
        { status: 403 }
      );
    }

    const updatedMember = await prisma.agencyMember.update({
      where: { id: memberId },
      data: {
        ...(memberRole && { role: memberRole }),
        ...(permissions && { permissions }),
        ...(status && { status }),
        ...(status === "ACCEPTED" && { acceptedAt: new Date() }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, member: updatedMember });
  } catch (error: unknown) {
    console.error("Update member error:", error);
    return NextResponse.json(
      { error: "Failed to update member" },
      { status: 500 }
    );
  }
}

// DELETE: Remove member
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { agency, role, isOwner } = await getUserAgencyWithRole(user.id);

    if (!agency) {
      return NextResponse.json({ error: "No agency found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get("id");

    if (!memberId) {
      return NextResponse.json(
        { error: "Member ID is required" },
        { status: 400 }
      );
    }

    // Verify member belongs to agency
    const existingMember = await prisma.agencyMember.findFirst({
      where: { id: memberId, agencyId: agency.id },
    });

    if (!existingMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Can't remove owner
    if (existingMember.role === "OWNER") {
      return NextResponse.json(
        { error: "Cannot remove agency owner" },
        { status: 403 }
      );
    }

    // Only owners/admins can remove others, or member can remove themselves
    if (!isOwner && role !== "ADMIN" && existingMember.userId !== user.id) {
      return NextResponse.json(
        { error: "You don't have permission to remove this member" },
        { status: 403 }
      );
    }

    await prisma.agencyMember.delete({ where: { id: memberId } });

    return NextResponse.json({ success: true, message: "Member removed" });
  } catch (error: unknown) {
    console.error("Remove member error:", error);
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 }
    );
  }
}
