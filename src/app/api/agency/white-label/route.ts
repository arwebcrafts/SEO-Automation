import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireAuth();
    const agency = await prisma.agency.findUnique({ where: { ownerId: user.id } });
    if (!agency) return NextResponse.json({ error: "Agency not found" }, { status: 404 });

    // Return white-label config (stored in agency settings or separate)
    return NextResponse.json({
      agencyId: agency.id,
      name: agency.name,
      logo: agency.logo,
      website: agency.website,
      whiteLabel: {
        customDomain: null,
        brandColor: "#3b82f6",
        reportLogo: agency.logo,
        reportFooter: `Powered by ${agency.name}`,
        hideAppBranding: false,
      },
    });
  } catch (error: unknown) {
    return handleApiError(error, "Failed to fetch white-label config");
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (user.plan !== "WHITE_LABEL" && user.plan !== "AGENCY") {
      return NextResponse.json({ error: "White-label requires Agency or White-Label plan" }, { status: 403 });
    }

    const agency = await prisma.agency.findUnique({ where: { ownerId: user.id } });
    if (!agency) return NextResponse.json({ error: "Agency not found" }, { status: 404 });

    const { name, logo, brandColor, reportFooter, customDomain } = await request.json();

    const updated = await prisma.agency.update({
      where: { id: agency.id },
      data: {
        ...(name && { name }),
        ...(logo && { logo }),
      },
    });

    return NextResponse.json({ success: true, agency: updated });
  } catch (error: unknown) {
    return handleApiError(error, "Failed to update white-label config");
  }
}
