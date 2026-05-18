import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Helper to get user's agency
async function getUserAgency(userId: string) {
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

  return userWithAgency?.ownedAgency || userWithAgency?.agencyMemberships[0]?.agency;
}

// GET: List all clients
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const agency = await getUserAgency(user.id);

    if (!agency) {
      return NextResponse.json({ error: "No agency found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: any = { agencyId: agency.id };
    
    if (status && status !== "all") {
      where.status = status.toUpperCase();
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { website: { contains: search, mode: "insensitive" } },
      ];
    }

    const clients = await prisma.agencyClient.findMany({
      where,
      include: {
        audits: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        contentAnalyses: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        _count: {
          select: {
            audits: true,
            contentAnalyses: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ clients });
  } catch (error: unknown) {
    console.error("Get clients error:", error);
    return NextResponse.json(
      { error: "Failed to get clients" },
      { status: 500 }
    );
  }
}

// POST: Create new client
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const agency = await getUserAgency(user.id);

    if (!agency) {
      return NextResponse.json({ error: "No agency found" }, { status: 404 });
    }

    // Check client limit
    const clientCount = await prisma.agencyClient.count({
      where: { agencyId: agency.id },
    });

    if (clientCount >= agency.maxClients) {
      return NextResponse.json(
        { error: `Client limit reached (${agency.maxClients}). Upgrade to add more clients.` },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, email, phone, company, website, logo, notes } = body;

    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Client name is required" },
        { status: 400 }
      );
    }

    const client = await prisma.agencyClient.create({
      data: {
        agencyId: agency.id,
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        company: company?.trim() || null,
        website: website?.trim() || null,
        logo: logo || null,
        notes: notes?.trim() || null,
      },
    });

    return NextResponse.json({ success: true, client });
  } catch (error: unknown) {
    console.error("Create client error:", error);
    return NextResponse.json(
      { error: "Failed to create client" },
      { status: 500 }
    );
  }
}

// PUT: Update client
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();
    const agency = await getUserAgency(user.id);

    if (!agency) {
      return NextResponse.json({ error: "No agency found" }, { status: 404 });
    }

    const body = await request.json();
    const { id, name, email, phone, company, website, logo, notes, status } = body;

    if (!id) {
      return NextResponse.json({ error: "Client ID is required" }, { status: 400 });
    }

    // Verify client belongs to agency
    const existingClient = await prisma.agencyClient.findFirst({
      where: { id, agencyId: agency.id },
    });

    if (!existingClient) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const updatedClient = await prisma.agencyClient.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(email !== undefined && { email: email?.trim() || null }),
        ...(phone !== undefined && { phone: phone?.trim() || null }),
        ...(company !== undefined && { company: company?.trim() || null }),
        ...(website !== undefined && { website: website?.trim() || null }),
        ...(logo !== undefined && { logo }),
        ...(notes !== undefined && { notes: notes?.trim() || null }),
        ...(status && { status }),
      },
    });

    return NextResponse.json({ success: true, client: updatedClient });
  } catch (error: unknown) {
    console.error("Update client error:", error);
    return NextResponse.json(
      { error: "Failed to update client" },
      { status: 500 }
    );
  }
}

// DELETE: Delete client
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth();
    const agency = await getUserAgency(user.id);

    if (!agency) {
      return NextResponse.json({ error: "No agency found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Client ID is required" }, { status: 400 });
    }

    // Verify client belongs to agency
    const existingClient = await prisma.agencyClient.findFirst({
      where: { id, agencyId: agency.id },
    });

    if (!existingClient) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    await prisma.agencyClient.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Client deleted" });
  } catch (error: unknown) {
    console.error("Delete client error:", error);
    return NextResponse.json(
      { error: "Failed to delete client" },
      { status: 500 }
    );
  }
}
