import sgMail from "@sendgrid/mail";
import type { Contact, ReviewSettings, WordPressSite } from "@prisma/client";

export function buildReviewLink(placeId: string | null | undefined): string {
  if (!placeId) return "https://www.google.com/maps";
  return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`;
}

export function applyTemplate(
  template: string,
  vars: { name: string; business: string; link: string; unsubscribe: string }
): string {
  return template
    .replace(/\{name\}/gi, vars.name)
    .replace(/\{business\}/gi, vars.business)
    .replace(/\{link\}/gi, vars.link)
    .replace(/\{unsubscribe\}/gi, vars.unsubscribe);
}

export async function sendReviewEmail(params: {
  to: string;
  subject: string;
  html: string;
  fromEmail: string;
  fromName: string;
  apiKey: string;
}): Promise<void> {
  sgMail.setApiKey(params.apiKey);
  await sgMail.send({
    to: params.to,
    from: { email: params.fromEmail, name: params.fromName },
    subject: params.subject,
    html: params.html,
  });
}

export function defaultEmailTemplate(): string {
  return `<p>Hi {name},</p>
<p>Thank you for choosing {business}. If you have a moment, we would truly appreciate a short review:</p>
<p><a href="{link}">Leave a review on Google</a></p>
<p>Thank you!<br/>{business}</p>
<p style="font-size:12px;color:#666;"><a href="{unsubscribe}">Unsubscribe from review reminders</a></p>`;
}

export function defaultFollowUpTemplate(): string {
  return `<p>Hi {name},</p>
<p>Quick follow-up from {business} — if you are happy with our service, a Google review helps others find us:</p>
<p><a href="{link}">Leave a review</a></p>
<p style="font-size:12px;color:#666;"><a href="{unsubscribe}">Unsubscribe</a></p>`;
}

export type ReviewSendContext = {
  contact: Contact;
  settings: ReviewSettings;
  site: WordPressSite;
  businessName: string;
  placeId: string | null;
  appBaseUrl: string;
};

export async function sendScheduledReviewMessage(
  ctx: ReviewSendContext,
  messageType: "initial" | "followup"
): Promise<void> {
  const apiKey =
    ctx.settings.sendgridApiKey || process.env.SENDGRID_API_KEY || "";
  if (!apiKey) {
    throw new Error("SendGrid API key not configured on site or server");
  }
  const fromEmail = ctx.settings.fromEmail || process.env.SENDGRID_FROM_EMAIL || "";
  const fromName = ctx.settings.fromName || ctx.businessName;
  if (!fromEmail || !ctx.contact.email) {
    throw new Error("From email or contact email missing");
  }

  const link = buildReviewLink(
    ctx.placeId || ctx.settings.reviewLinkBase || null
  );
  const token = ctx.contact.unsubscribeToken || "";
  const unsubscribe = `${ctx.appBaseUrl.replace(/\/$/, "")}/api/reviews/unsubscribe?token=${encodeURIComponent(token)}`;

  const tpl =
    messageType === "followup"
      ? ctx.settings.followUpTemplate || defaultFollowUpTemplate()
      : ctx.settings.emailTemplate || defaultEmailTemplate();

  const body = applyTemplate(tpl, {
    name: ctx.contact.name || "there",
    business: ctx.businessName,
    link,
    unsubscribe,
  });

  const subjectTpl = ctx.settings.emailSubject || "How was your experience with {business}?";
  const subject = applyTemplate(subjectTpl, {
    name: ctx.contact.name || "there",
    business: ctx.businessName,
    link,
    unsubscribe,
  });

  await sendReviewEmail({
    to: ctx.contact.email,
    subject,
    html: body,
    fromEmail,
    fromName,
    apiKey,
  });
}
