import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";


export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { accountType, agencyName } = body;

    if (!accountType || !["INDIVIDUAL", "AGENCY"].includes(accountType)) {
      return NextResponse.json(
        { error: "Invalid account type" },
        { status: 400 }
      );
    }

    // Update user account type
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        accountType,
        onboardingCompleted: true,
        role: accountType === "AGENCY" ? "AGENCY_ADMIN" : "CLIENT",
      },
    });

    // If agency account, create the agency
    if (accountType === "AGENCY") {
      if (!agencyName || agencyName.trim().length < 2) {
        return NextResponse.json(
          { error: "Agency name is required and must be at least 2 characters" },
          { status: 400 }
        );
      }

      // Generate slug from agency name
      const baseSlug = agencyName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      
      // Check if slug exists and make unique if needed
      let slug = baseSlug;
      let counter = 1;
      while (await prisma.agency.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      // Create agency
      const agency = await prisma.agency.create({
        data: {
          name: agencyName.trim(),
          slug,
          ownerId: user.id,
        },
      });

      // Add owner as an agency member with OWNER role
      await prisma.agencyMember.create({
        data: {
          agencyId: agency.id,
          userId: user.id,
          role: "OWNER",
          status: "ACCEPTED",
          acceptedAt: new Date(),
          permissions: ["all"],
        },
      });

      return NextResponse.json({
        success: true,
        user: updatedUser,
        agency,
      });
    }

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error: unknown) {
    console.error("Onboarding error:", error);
    return NextResponse.json(
      { error: "Failed to complete onboarding" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const user = await requireAuth();

    // Get user with agency info
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        ownedAgency: true,
        agencyMemberships: {
          include: {
            agency: true,
          },
        },
      },
    });

    return NextResponse.json({
      onboardingCompleted: userData?.onboardingCompleted || false,
      accountType: userData?.accountType || "INDIVIDUAL",
      agency: userData?.ownedAgency || userData?.agencyMemberships[0]?.agency || null,
    });
  } catch (error: unknown) {
    console.error("Get onboarding status error:", error);
    return NextResponse.json(
      { error: "Failed to get onboarding status" },
      { status: 500 }
    );
  }
}
