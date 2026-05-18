import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";


// GET: Fetch keywords for a site
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId");

    if (!siteId) {
      return NextResponse.json(
        { error: "Site ID is required" },
        { status: 400 }
      );
    }

    const keywords = await prisma.keyword.findMany({
      where: {
        wordpressSiteId: siteId,
      },
      include: {
        _count: {
          select: {
            scheduledContent: true,
          },
        },
      },
      orderBy: [
        { searchVolume: "desc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({ success: true, data: keywords });
  } catch (error) {
    console.error("Error fetching keywords:", error);
    return NextResponse.json(
      { error: "Failed to fetch keywords" },
      { status: 500 }
    );
  }
}

// POST: Add keywords (bulk or single)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { siteId, keywords } = body;

    if (!siteId || !keywords || !Array.isArray(keywords)) {
      return NextResponse.json(
        { error: "Site ID and keywords array are required" },
        { status: 400 }
      );
    }

    const createdKeywords = [];
    const skipped = [];

    for (const kw of keywords) {
      try {
        const created = await prisma.keyword.create({
          data: {
            wordpressSiteId: siteId,
            keyword: kw.keyword,
            searchVolume: kw.searchVolume || null,
            difficulty: kw.difficulty || null,
            cpc: kw.cpc || null,
            intent: kw.intent || null,
            location: kw.location || null,
            isGenerated: kw.isGenerated || false,
          },
        });
        createdKeywords.push(created);
      } catch (error: any) {
        if (error.code === "P2002") {
          skipped.push(kw.keyword);
        } else {
          throw error;
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: createdKeywords,
      created: createdKeywords.length,
      skipped: skipped.length,
      skippedKeywords: skipped,
    });
  } catch (error) {
    console.error("Error creating keywords:", error);
    return NextResponse.json(
      { error: "Failed to create keywords" },
      { status: 500 }
    );
  }
}

// DELETE: Remove keyword
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Keyword ID is required" },
        { status: 400 }
      );
    }

    await prisma.keyword.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Keyword deleted" });
  } catch (error) {
    console.error("Error deleting keyword:", error);
    return NextResponse.json(
      { error: "Failed to delete keyword" },
      { status: 500 }
    );
  }
}
