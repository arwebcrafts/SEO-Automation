import { Resend } from "resend";
import { logger } from "@/lib/logger";

const log = logger.child({ service: "email-engine" });

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  tags?: { name: string; value: string }[];
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

const DEFAULT_FROM = process.env.EMAIL_FROM || "SEO Hub <notifications@seoaudit.app>";

export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  if (!resend) {
    log.warn("Email not configured - RESEND_API_KEY missing");
    return { success: false, error: "Email provider not configured" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: options.from || DEFAULT_FROM,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
      tags: options.tags,
    });

    if (error) {
      log.error("Email send failed", new Error(error.message));
      return { success: false, error: error.message };
    }

    log.info("Email sent successfully", { messageId: data?.id, to: options.to });
    return { success: true, messageId: data?.id };
  } catch (error) {
    log.error("Email send error", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// Template rendering
export function renderTemplate(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, "g"), value);
  }
  return result;
}

// Pre-built email templates
export const EMAIL_TEMPLATES = {
  weeklyReport: (vars: { userName: string; domain: string; score: number; reportUrl: string }) => ({
    subject: `Weekly SEO Report - ${vars.domain}`,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 32px;">
        <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h1 style="color: #1e293b; margin-bottom: 8px;">Weekly SEO Report</h1>
          <p style="color: #64748b;">Hi ${vars.userName},</p>
          <p style="color: #475569;">Here's your weekly SEO summary for <strong>${vars.domain}</strong>.</p>
          <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; margin: 16px 0; text-align: center;">
            <p style="color: #64748b; margin: 0; font-size: 14px;">Overall Score</p>
            <p style="color: #3b82f6; font-size: 48px; font-weight: bold; margin: 4px 0;">${vars.score}</p>
          </div>
          <a href="${vars.reportUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">View Full Report</a>
        </div>
      </div>
    `,
  }),

  reviewRequest: (vars: { businessName: string; customerName: string; reviewUrl: string; unsubscribeUrl: string }) => ({
    subject: `How was your experience with ${vars.businessName}?`,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 32px;">
        <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h1 style="color: #1e293b;">We'd love your feedback!</h1>
          <p style="color: #475569;">Hi ${vars.customerName},</p>
          <p style="color: #475569;">Thank you for choosing <strong>${vars.businessName}</strong>. We'd appreciate if you could take a moment to share your experience.</p>
          <a href="${vars.reviewUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px;">Leave a Review</a>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;"><a href="${vars.unsubscribeUrl}" style="color: #94a3b8;">Unsubscribe</a></p>
        </div>
      </div>
    `,
  }),
};
