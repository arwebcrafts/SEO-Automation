import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import {
  extractPlaceIdFromGoogleUrl,
  fetchPlaceDetailsV1,
  type PlaceDetailsV1,
} from "@/lib/places-details";

const API_KEY = process.env.GOOGLE_PLACES_API_KEY || "";

async function findPlaceIdInPageHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; SeoRise/1.0)" },
      redirect: "follow",
    });
    if (!res.ok) return null;
    const html = await res.text();
    const m = html.match(/ChIJ[A-Za-z0-9_-]{20,}/);
    return m ? m[0] : null;
  } catch {
    return null;
  }
}

function toResponsePayload(d: PlaceDetailsV1) {
  return {
    businessName: d.businessName,
    address: d.address,
    phone: d.phone,
    website: d.website,
    rating: d.rating,
    reviewCount: d.reviewCount,
    primaryCategory: d.primaryCategory,
    additionalCategories: d.additionalCategories,
    photoCount: d.photoCount,
    hasWorkHours: d.hasWorkHours,
    workHours: d.workHours,
    isClaimed: d.isClaimed,
    placeId: d.placeId,
  };
}

/** Public POST for GBP audit tool; optional auth for caching to a site. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const url = typeof body.url === "string" ? body.url : "";
    let placeId = typeof body.placeId === "string" ? body.placeId : "";
    const wordpressSiteId =
      typeof body.wordpressSiteId === "string" ? body.wordpressSiteId : "";

    if (!API_KEY) {
      return NextResponse.json(
        { error: "Google Places API key not configured (GOOGLE_PLACES_API_KEY)" },
        { status: 500 }
      );
    }

    if (!placeId && url) {
      placeId = extractPlaceIdFromGoogleUrl(url) || "";
    }
    if (!placeId && url) {
      placeId = (await findPlaceIdInPageHtml(url)) || "";
    }

    if (!placeId) {
      return NextResponse.json(
        {
          error:
            "Could not resolve a Place ID from this URL. Open the listing in Google Maps, use Share, or pick a result from Places search that returns a place ID.",
        },
        { status: 400 }
      );
    }

    const details = await fetchPlaceDetailsV1(placeId, API_KEY);
    const data = toResponsePayload(details);

    if (wordpressSiteId) {
      try {
        const user = await requireAuth();
        const site = await prisma.wordPressSite.findFirst({
          where: { id: wordpressSiteId, userId: user.id },
        });
        if (site) {
          await prisma.wordPressSite.update({
            where: { id: site.id },
            data: { gbpPlaceId: details.placeId },
          });
          await prisma.gbpSnapshot.upsert({
            where: { wordpressSiteId: site.id },
            create: {
              wordpressSiteId: site.id,
              placeId: details.placeId,
              name: details.businessName,
              address: details.address,
              rating: details.rating ? parseFloat(details.rating) : null,
              reviewCount: details.reviewCount ? parseInt(details.reviewCount, 10) : null,
              isVerified: details.isClaimed,
              hoursJson: details.rawHours as object | undefined,
              categoriesJson: details.rawCategories as object | undefined,
              phone: details.phone || null,
              websiteUri: details.website || null,
            },
            update: {
              placeId: details.placeId,
              name: details.businessName,
              address: details.address,
              rating: details.rating ? parseFloat(details.rating) : null,
              reviewCount: details.reviewCount ? parseInt(details.reviewCount, 10) : null,
              isVerified: details.isClaimed,
              hoursJson: details.rawHours as object | undefined,
              categoriesJson: details.rawCategories as object | undefined,
              phone: details.phone || null,
              websiteUri: details.website || null,
              cachedAt: new Date(),
            },
          });
        }
      } catch {
        // ignore cache failures when not logged in or site mismatch
      }
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("GBP Places error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to load business from Google Places",
      },
      { status: 500 }
    );
  }
}
