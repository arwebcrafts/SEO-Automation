import { task, schedules } from "@trigger.dev/sdk/v3";

export const refreshGbpTask = task({
  id: "refresh-gbp",
  run: async (payload: { userId: string; placeId: string; domain: string }) => {
    console.log(`[GBP Refresh] Starting for ${payload.domain}`);

    try {
      const apiKey = process.env.GOOGLE_PLACES_API_KEY;
      if (!apiKey) {
        console.warn("[GBP Refresh] No API key configured");
        return { success: false, reason: "No API key" };
      }

      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${payload.placeId}&fields=name,rating,user_ratings_total,reviews,opening_hours&key=${apiKey}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== "OK") {
        return { success: false, reason: data.status };
      }

      const result = data.result;
      console.log(`[GBP Refresh] Updated data for ${result.name}: rating=${result.rating}, reviews=${result.user_ratings_total}`);

      return {
        success: true,
        data: {
          name: result.name,
          rating: result.rating,
          totalRatings: result.user_ratings_total,
          openNow: result.opening_hours?.open_now,
          reviewCount: result.reviews?.length || 0,
        },
      };
    } catch (error) {
      console.error("[GBP Refresh] Error:", error);
      return { success: false, reason: String(error) };
    }
  },
});
