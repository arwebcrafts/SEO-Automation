import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { getPlanLimits } from "@/lib/plan-limits";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const limits = getPlanLimits(user);
    if (!limits.chatbotEnabled) {
      return NextResponse.json({ error: "Plan does not include chatbot" }, { status: 402 });
    }

    const siteId = request.nextUrl.searchParams.get("wordpressSiteId");
    if (!siteId) {
      return NextResponse.json({ error: "wordpressSiteId required" }, { status: 400 });
    }

    const site = await prisma.wordPressSite.findFirst({
      where: { id: siteId, userId: user.id },
      include: { chatbotConfig: true },
    });
    if (!site) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      allowedDomains: site.chatbotConfig?.allowedDomains ?? [],
      isEnabled: site.chatbotConfig?.isEnabled ?? false,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const limits = getPlanLimits(user);
    if (!limits.chatbotEnabled) {
      return NextResponse.json({ error: "Plan does not include chatbot" }, { status: 402 });
    }

    const body = await request.json();
    const { wordpressSiteId, allowedDomains, isEnabled, businessName, greeting, primaryColor, systemPrompt, leadFormEnabled } = body;

    if (!wordpressSiteId) {
      return NextResponse.json({ error: "wordpressSiteId required" }, { status: 400 });
    }

    const site = await prisma.wordPressSite.findFirst({
      where: { id: wordpressSiteId, userId: user.id },
    });
    if (!site) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const domains: string[] = Array.isArray(allowedDomains)
      ? allowedDomains.map((d: string) => String(d).trim().toLowerCase()).filter(Boolean)
      : [];

    const cfg = await prisma.chatbotConfig.upsert({
      where: { wordpressSiteId },
      create: {
        wordpressSiteId,
        allowedDomains: domains,
        isEnabled: !!isEnabled,
        businessName: businessName || site.name,
        greeting: greeting || "Hi! How can we help?",
        primaryColor: primaryColor || "#2563eb",
        systemPrompt:
          systemPrompt ||
          `You are a helpful assistant for ${businessName || site.name}. Answer questions about services and capture leads when appropriate.`,
        leadFormEnabled: leadFormEnabled !== false,
      },
      update: {
        ...(allowedDomains !== undefined ? { allowedDomains: domains } : {}),
        ...(isEnabled !== undefined ? { isEnabled: !!isEnabled } : {}),
        ...(businessName !== undefined ? { businessName: String(businessName) } : {}),
        ...(greeting !== undefined ? { greeting: String(greeting) } : {}),
        ...(primaryColor !== undefined ? { primaryColor: String(primaryColor) } : {}),
        ...(systemPrompt !== undefined ? { systemPrompt: String(systemPrompt) } : {}),
        ...(leadFormEnabled !== undefined ? { leadFormEnabled: !!leadFormEnabled } : {}),
      },
    });

    return NextResponse.json({ data: cfg });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error" },
      { status: 500 }
    );
  }
}
