const PLACES_V1 = "https://places.googleapis.com/v1/places";

export type PlaceDetailsV1 = {
  businessName: string;
  address: string;
  phone: string;
  website: string;
  rating: string;
  reviewCount: string;
  primaryCategory: string;
  additionalCategories: string;
  photoCount: string;
  hasWorkHours: boolean;
  workHours: string;
  isClaimed: boolean;
  placeId: string;
  rawCategories: unknown;
  rawHours: unknown;
};

const FIELD_MASK = [
  "id",
  "displayName",
  "formattedAddress",
  "rating",
  "userRatingCount",
  "currentOpeningHours",
  "regularOpeningHours",
  "photos",
  "primaryType",
  "types",
  "businessStatus",
  "nationalPhoneNumber",
  "websiteUri",
].join(",");

export async function fetchPlaceDetailsV1(placeId: string, apiKey: string): Promise<PlaceDetailsV1> {
  const id = placeId.replace(/^places\//, "");
  const url = `${PLACES_V1}/${encodeURIComponent(id)}`;
  const res = await fetch(url, {
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Places API error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as Record<string, unknown>;
  const displayName = (data.displayName as { text?: string } | undefined)?.text ?? "";
  const address = (data.formattedAddress as string) ?? "";
  const phone = (data.nationalPhoneNumber as string) ?? "";
  const website = (data.websiteUri as string) ?? "";
  const rating = data.rating != null ? String(data.rating) : "";
  const reviewCount =
    data.userRatingCount != null ? String(data.userRatingCount as number) : "0";
  const primaryType = (data.primaryType as string) ?? "";
  const types = (data.types as string[] | undefined) ?? [];
  const additional = types.filter((t) => t !== primaryType).join(", ");
  const photos = (data.photos as unknown[] | undefined) ?? [];
  const hours =
    (data.currentOpeningHours as Record<string, unknown> | undefined) ??
    (data.regularOpeningHours as Record<string, unknown> | undefined);
  const weekdayDescriptions = (hours?.weekdayDescriptions as string[] | undefined) ?? [];
  const workHours = weekdayDescriptions.join("; ");
  const businessStatus = (data.businessStatus as string) ?? "";
  const resourceName = (data.id as string) ?? placeId;
  const cleanPlaceId = resourceName.replace(/^places\//, "");

  return {
    businessName: displayName,
    address,
    phone,
    website,
    rating,
    reviewCount,
    primaryCategory: primaryType.replace(/_/g, " "),
    additionalCategories: additional.replace(/_/g, " "),
    photoCount: String(photos.length),
    hasWorkHours: weekdayDescriptions.length > 0,
    workHours,
    isClaimed: businessStatus === "OPERATIONAL",
    placeId: cleanPlaceId,
    rawCategories: { primaryType, types },
    rawHours: hours ?? null,
  };
}

export function extractPlaceIdFromGoogleUrl(url: string): string | null {
  const u = url.trim();
  const q = u.match(/[?&]query_place_id=([^&]+)/);
  if (q?.[1]) return decodeURIComponent(q[1]);
  const place = u.match(/\/place\/[^/]+\/(@?[^/]+)/);
  if (place?.[1] && place[1].startsWith("ChIJ")) return place[1].split("/")[0] ?? null;
  const dataMatch = u.match(/!1s(0x[0-9a-f]+:0x[0-9a-f]+)/i);
  if (dataMatch?.[1]) return null;
  const cid = u.match(/place\/(ChIJ[a-zA-Z0-9_-]+)/);
  if (cid?.[1]) return cid[1];
  const ftid = u.match(/ftid=([^&]+)/);
  if (ftid?.[1]?.startsWith("ChIJ")) return decodeURIComponent(ftid[1]);
  return null;
}
