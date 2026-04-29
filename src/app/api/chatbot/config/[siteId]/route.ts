import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPlanLimits } from "@/lib/plan-limits";
import { corsAllowOrigin, applyChatbotCorsHeaders } from "@/lib/chatbot-cors";

export const dynamic = "force-dynamic";

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  const parts = request.nextUrl.pathname.split("/").filter(Boolean);
  const siteId = parts[parts.length - 1] || "";
  const cfg = await prisma.chatbotConfig.findUnique({
    where: { wordpressSiteId: siteId },
  });
  const allow = cfg ? corsAllowOrigin(origin, cfg.allowedDomains) : null;
  const headers = new Headers();
  applyChatbotCorsHeaders(headers, allow);
  headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");
  return new NextResponse(null, { status: 204, headers });
}

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ siteId: string }> }
) {
  const { siteId } = await ctx.params;
  const origin = request.headers.get("origin");
  const headers = new Headers();

  const site = await prisma.wordPressSite.findUnique({
    where: { id: siteId },
    include: { user: true, chatbotConfig: true },
  });

  if (!site?.chatbotConfig?.isEnabled) {
    return NextResponse.json({ error: "Chatbot disabled" }, { status: 403 });
  }

  const limits = getPlanLimits(site.user);
  if (!limits.chatbotEnabled) {
    return NextResponse.json({ error: "Plan does not include chatbot" }, { status: 403 });
  }

  const allow = corsAllowOrigin(origin, site.chatbotConfig.allowedDomains);
  if (!allow) {
    return NextResponse.json({ error: "Origin not allowed" }, { status: 403 });
  }

  applyChatbotCorsHeaders(headers, allow);
  headers.set("Content-Type", "application/json");

  const c = site.chatbotConfig;
  return new NextResponse(
    JSON.stringify({
      businessName: c.businessName,
      greeting: c.greeting,
      primaryColor: c.primaryColor,
      leadFormEnabled: c.leadFormEnabled,
    }),
    { headers }
  );
}
