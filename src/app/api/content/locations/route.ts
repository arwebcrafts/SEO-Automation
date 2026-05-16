import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { domain, locations, businessType } = await request.json();

    if (!domain || !locations?.length) {
      return NextResponse.json({ error: "Domain and locations required" }, { status: 400 });
    }

    const pages = await Promise.all(
      locations.map(async (loc: string) => {
        const slug = loc.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        return prisma.locationPage.create({
          data: {
            userId: user.id,
            domain,
            location: loc,
            title: `${businessType || "Services"} in ${loc} | ${domain}`,
            slug,
            content: `<h1>${businessType || "Professional Services"} in ${loc}</h1>\n<p>Looking for quality ${(businessType || "services").toLowerCase()} in ${loc}? We provide top-rated solutions tailored for the ${loc} community.</p>`,
            metaDesc: `Find the best ${(businessType || "services").toLowerCase()} in ${loc}. Professional, reliable, and locally trusted.`,
            keywords: [loc.toLowerCase(), (businessType || "services").toLowerCase(), `${(businessType || "services").toLowerCase()} ${loc.toLowerCase()}`],
          },
        });
      })
    );

    return NextResponse.json({ success: true, pages, count: pages.length });
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate location pages" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get("domain");

    const pages = await prisma.locationPage.findMany({
      where: { userId: user.id, ...(domain && { domain }) },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ pages });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch location pages" }, { status: 500 });
  }
}
