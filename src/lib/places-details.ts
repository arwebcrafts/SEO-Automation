import { logger } from "@/lib/logger";

const log = logger.child({ service: "places-details" });

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || "";

export interface PlaceDetails {
  placeId: string;
  name: string;
  formattedAddress: string;
  phone?: string;
  website?: string;
  rating?: number;
  totalRatings?: number;
  types?: string[];
  openingHours?: string[];
  location?: { lat: number; lng: number };
  photos?: string[];
  reviews?: PlaceReview[];
}

export interface PlaceReview {
  author: string;
  rating: number;
  text: string;
  time: number;
}

export async function getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  if (!GOOGLE_PLACES_API_KEY) {
    log.warn("GOOGLE_PLACES_API_KEY not configured");
    return null;
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,types,opening_hours,geometry,photos,reviews&key=${GOOGLE_PLACES_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK" || !data.result) {
      log.warn("Places API returned non-OK status", { status: data.status, placeId });
      return null;
    }

    const r = data.result;
    return {
      placeId,
      name: r.name || "",
      formattedAddress: r.formatted_address || "",
      phone: r.formatted_phone_number,
      website: r.website,
      rating: r.rating,
      totalRatings: r.user_ratings_total,
      types: r.types,
      openingHours: r.opening_hours?.weekday_text,
      location: r.geometry?.location ? { lat: r.geometry.location.lat, lng: r.geometry.location.lng } : undefined,
      photos: r.photos?.slice(0, 5).map((p: any) =>
        `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${p.photo_reference}&key=${GOOGLE_PLACES_API_KEY}`
      ),
      reviews: r.reviews?.map((rev: any) => ({
        author: rev.author_name,
        rating: rev.rating,
        text: rev.text,
        time: rev.time,
      })),
    };
  } catch (error) {
    log.error("Failed to fetch place details", error);
    return null;
  }
}

export async function searchPlaces(query: string, location?: string): Promise<{ placeId: string; name: string; address: string }[]> {
  if (!GOOGLE_PLACES_API_KEY) return [];

  try {
    const input = location ? `${query} ${location}` : query;
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(input)}&key=${GOOGLE_PLACES_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK") return [];

    return data.results.slice(0, 10).map((r: any) => ({
      placeId: r.place_id,
      name: r.name,
      address: r.formatted_address,
    }));
  } catch (error) {
    log.error("Places search failed", error);
    return [];
  }
}
