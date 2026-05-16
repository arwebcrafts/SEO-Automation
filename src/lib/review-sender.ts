import { sendEmail, EMAIL_TEMPLATES } from "@/lib/email-engine";
import { logger } from "@/lib/logger";

const log = logger.child({ service: "review-sender" });

export interface ReviewContact {
  email: string;
  name: string;
  phone?: string;
}

export interface ReviewSendOptions {
  businessName: string;
  reviewUrl: string;
  contacts: ReviewContact[];
  unsubscribeBaseUrl: string;
}

export async function sendReviewRequests(options: ReviewSendOptions) {
  const results: { email: string; success: boolean; error?: string }[] = [];

  for (const contact of options.contacts) {
    try {
      const template = EMAIL_TEMPLATES.reviewRequest({
        businessName: options.businessName,
        customerName: contact.name,
        reviewUrl: options.reviewUrl,
        unsubscribeUrl: `${options.unsubscribeBaseUrl}?email=${encodeURIComponent(contact.email)}`,
      });

      const result = await sendEmail({
        to: contact.email,
        subject: template.subject,
        html: template.html,
        tags: [{ name: "type", value: "review-request" }],
      });

      results.push({ email: contact.email, success: result.success, error: result.error });

      // Small delay between emails to avoid rate limits
      await new Promise((r) => setTimeout(r, 200));
    } catch (error) {
      log.error(`Failed to send review request to ${contact.email}`, error);
      results.push({ email: contact.email, success: false, error: String(error) });
    }
  }

  const sent = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  log.info(`Review requests completed: ${sent} sent, ${failed} failed`);

  return { results, sent, failed };
}
