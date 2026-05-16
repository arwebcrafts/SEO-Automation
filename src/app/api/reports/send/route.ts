import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { sendEmail } from "@/lib/email-engine";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { to, subject, reportHtml } = await request.json();

    if (!to || !reportHtml) return NextResponse.json({ error: "Recipient and report content required" }, { status: 400 });

    const result = await sendEmail({
      to,
      subject: subject || "SEO Report",
      html: reportHtml,
    });

    return NextResponse.json({ success: result.success, messageId: result.messageId });
  } catch (error) {
    return NextResponse.json({ error: "Failed to send report" }, { status: 500 });
  }
}
