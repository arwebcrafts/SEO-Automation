import { NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET: Get current user's context (agency status, active client, etc.)
export async function GET() {
  try {
    const user = await requireAuth();

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        ownedAgency: {
          include: {
            clients: {
              where: { status: "ACTIVE" },
              orderBy: { name: "asc" },
              select: {
                id: true,
                name: true,
                company: true,
                website: true,
                logo: true,
              },
            },
          },
        },
        agencyMemberships: {
          where: { status: "ACCEPTED" },
          include: {
            agency: {
              include: {
                clients: {
                  where: { status: "ACTIVE" },
                  orderBy: { name: "asc" },
                  select: {
                    id: true,
                    name: true,
                    company: true,
                    website: true,
                    logo: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isAgency = userData.accountType === "AGENCY";
    const agency = userData.ownedAgency || userData.agencyMemberships[0]?.agency;
    const clients = agency?.clients || [];
    
    // Get active client details
    let activeClient = null;
    if (userData.activeClientId && clients.length > 0) {
      activeClient = clients.find((c) => c.id === userData.activeClientId) || null;
    }
    
    // If no active client but has clients, default to first one
    if (!activeClient && clients.length > 0) {
      activeClient = clients[0];
      // Update user's active client
      await prisma.user.update({
        where: { id: user.id },
        data: { activeClientId: clients[0].id },
      });
    }

    // Check if user is admin
    const isAdmin = userData.email === "mwaqarsikandar@gmail.com" || userData.role === "ADMIN";

    return NextResponse.json({
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        accountType: userData.accountType,
        role: userData.role,
        onboardingCompleted: userData.onboardingCompleted,
      },
      isAgency,
      isAdmin,
      agency: agency
        ? {
            id: agency.id,
            name: agency.name,
            slug: agency.slug,
            logo: agency.logo,
          }
        : null,
      clients,
      activeClient,
    });
  } catch (error: unknown) {
    console.error("Get user context error:", error);
    return NextResponse.json(
      { error: "Failed to get user context" },
      { status: 500 }
    );
  }
}
