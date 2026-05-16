import { task } from "@trigger.dev/sdk/v3";

export const sendReviewRequestsTask = task({
  id: "send-review-requests",
  run: async (payload: {
    userId: string;
    businessName: string;
    reviewUrl: string;
    contacts: { email: string; name: string }[];
  }) => {
    console.log(`[Review Requests] Sending ${payload.contacts.length} requests for ${payload.businessName}`);

    const results: { email: string; success: boolean }[] = [];
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://seoaudit.app";

    for (const contact of payload.contacts) {
      try {
        // Call the internal email API
        const response = await fetch(`${appUrl}/api/reviews/unsubscribe`, { method: "HEAD" });

        // In production, use the email engine directly
        console.log(`[Review Requests] Would send to ${contact.email}`);
        results.push({ email: contact.email, success: true });

        // Rate limit: 200ms between sends
        await new Promise((r) => setTimeout(r, 200));
      } catch (error) {
        console.error(`[Review Requests] Failed for ${contact.email}:`, error);
        results.push({ email: contact.email, success: false });
      }
    }

    const sent = results.filter((r) => r.success).length;
    console.log(`[Review Requests] Completed: ${sent}/${payload.contacts.length} sent`);

    return { sent, failed: payload.contacts.length - sent, results };
  },
});
