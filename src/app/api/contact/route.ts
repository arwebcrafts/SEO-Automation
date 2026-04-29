import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const MAX_LEN = 8000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim().slice(0, 200) : "";
    const email = typeof body.email === "string" ? body.email.trim().slice(0, 320) : "";
    const message = typeof body.message === "string" ? body.message.trim().slice(0, MAX_LEN) : "";

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Name, email, and message are required." }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
    }

    const to = process.env.CONTACT_INBOX_EMAIL || process.env.RESEND_FROM_EMAIL;
    const apiKey = process.env.RESEND_API_KEY;

    if (apiKey && to) {
      const resend = new Resend(apiKey);
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
        to: [to],
        replyTo: email,
        subject: `[SeoRise contact] ${name}`,
        text: `From: ${name} <${email}>\n\n${message}`,
      });
    } else {
      logger.info("Contact form (no Resend configured)", { name, email, len: message.length });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    logger.error("Contact form error", { error: e instanceof Error ? e.message : String(e) });
    return NextResponse.json({ error: "Could not send message. Try again later." }, { status: 500 });
  }
}
