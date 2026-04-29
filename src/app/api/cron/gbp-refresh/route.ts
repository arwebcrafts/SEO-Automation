import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchPlaceDetailsV1 } from "@/lib/places-details";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const API_KEY = process.env.GOOGLE_PLACES_API_KEY || "";
const TTL_MS = 24 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!API_KEY) {
    return NextResponse.json({ error: "Places API not configured" }, { status: 500 });
  }

  const staleBefore = new Date(Date.now() - TTL_MS);
  const snapshots = await prisma.gbpSnapshot.findMany({
    where: { cachedAt: { lt: staleBefore } },
    take: 50,
    include: { wordpressSite: true },
  });

  let refreshed = 0;
  for (const snap of snapshots) {
    const placeId = snap.placeId || snap.wordpressSite.gbpPlaceId;
    if (!placeId) continue;
    try {
      const d = await fetchPlaceDetailsV1(placeId, API_KEY);
      await prisma.gbpSnapshot.update({
        where: { id: snap.id },
        data: {
          name: d.businessName,
          address: d.address,
          rating: d.rating ? parseFloat(d.rating) : null,
          reviewCount: d.reviewCount ? parseInt(d.reviewCount, 10) : null,
          isVerified: d.isClaimed,
          hoursJson: d.rawHours as object | undefined,
          categoriesJson: d.rawCategories as object | undefined,
          phone: d.phone || null,
          websiteUri: d.website || null,
          cachedAt: new Date(),
        },
      });
      refreshed++;
    } catch (e) {
      logger.error("gbp refresh failed", {
        id: snap.id,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return NextResponse.json({ ok: true, refreshed });
}
