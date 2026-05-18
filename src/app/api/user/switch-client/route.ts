import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST: Switch active client for agency user
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { clientId } = body;

    if (!clientId) {
      return NextResponse.json(
        { error: "Client ID is required" },
        { status: 400 }
      );
    }

    // Get user's agency
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        ownedAgency: true,
        agencyMemberships: {
          where: { status: "ACCEPTED" },
          include: { agency: true },
        },
      },
    });

    if (!userData || userData.accountType !== "AGENCY") {
      return NextResponse.json(
        { error: "Only agency users can switch clients" },
        { status: 403 }
      );
    }

    const agency = userData.ownedAgency || userData.agencyMemberships[0]?.agency;

    if (!agency) {
      return NextResponse.json({ error: "No agency found" }, { status: 404 });
    }

    // Verify client belongs to agency
    const client = await prisma.agencyClient.findFirst({
      where: {
        id: clientId,
        agencyId: agency.id,
        status: "ACTIVE",
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Client not found or not active" },
        { status: 404 }
      );
    }

    // Update user's active client
    await prisma.user.update({
      where: { id: user.id },
      data: { activeClientId: clientId },
    });

    // Log activity
    await prisma.userActivity.create({
      data: {
        userId: user.id,
        action: "client_switched",
        entityType: "client",
        entityId: clientId,
        description: `Switched to client: ${client.name}`,
        clientId,
      },
    });

    return NextResponse.json({
      success: true,
      activeClient: {
        id: client.id,
        name: client.name,
        company: client.company,
        website: client.website,
        logo: client.logo,
      },
    });
  } catch (error: unknown) {
    console.error("Switch client error:", error);
    return NextResponse.json(
      { error: "Failed to switch client" },
      { status: 500 }
    );
  }
}
