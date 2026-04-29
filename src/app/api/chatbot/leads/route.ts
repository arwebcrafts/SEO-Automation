import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPlanLimits } from "@/lib/plan-limits";
import { corsAllowOrigin, applyChatbotCorsHeaders } from "@/lib/chatbot-cors";
import { rateLimitChatbot } from "@/lib/chatbot-rate-limit";

export const dynamic = "force-dynamic";

function clientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  const siteId = request.nextUrl.searchParams.get("siteId") || "";
  const cfg = await prisma.chatbotConfig.findUnique({
    where: { wordpressSiteId: siteId },
  });
  const allow = cfg ? corsAllowOrigin(origin, cfg.allowedDomains) : null;
  const headers = new Headers();
  applyChatbotCorsHeaders(headers, allow);
  headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");
  return new NextResponse(null, { status: 204, headers });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const headers = new Headers();

  try {
    const body = await request.json();
    const { siteId, name, email, phone, firstMessage } = body as Record<
      string,
      string | undefined
    >;

    if (!siteId || !firstMessage) {
      return NextResponse.json({ error: "siteId and firstMessage required" }, { status: 400 });
    }

    const site = await prisma.wordPressSite.findUnique({
      where: { id: siteId },
      include: { user: true, chatbotConfig: true },
    });

    if (!site?.chatbotConfig?.isEnabled || !site.chatbotConfig.leadFormEnabled) {
      return NextResponse.json({ error: "Disabled" }, { status: 403 });
    }

    const limits = getPlanLimits(site.user);
    if (!limits.chatbotEnabled) {
      return NextResponse.json({ error: "Plan" }, { status: 403 });
    }

    const allow = corsAllowOrigin(origin, site.chatbotConfig.allowedDomains);
    if (!allow) {
      return NextResponse.json({ error: "Origin" }, { status: 403 });
    }

    if (!rateLimitChatbot(siteId, clientIp(request))) {
      return NextResponse.json({ error: "Rate limit" }, { status: 429 });
    }

    let sourceHost: string | null = null;
    try {
      if (origin) sourceHost = new URL(origin).hostname;
    } catch {
      sourceHost = null;
    }

    await prisma.chatbotLead.create({
      data: {
        wordpressSiteId: siteId,
        name: name || null,
        email: email || null,
        phone: phone || null,
        firstMessage,
        sourceHost,
      },
    });

    applyChatbotCorsHeaders(headers, allow);
    return NextResponse.json({ ok: true }, { headers });
  } catch (e) {
    console.error("chatbot lead", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
