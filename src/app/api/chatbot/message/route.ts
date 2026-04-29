import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPlanLimits } from "@/lib/plan-limits";
import { getOpenAiClientForUser, AiGateDeniedError } from "@/lib/ai-gatekeeper";
import { corsAllowOrigin, applyChatbotCorsHeaders } from "@/lib/chatbot-cors";
import { rateLimitChatbot } from "@/lib/chatbot-rate-limit";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function clientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  const siteId = request.nextUrl.searchParams.get("siteId") ?? "";
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
    const { siteId, messages } = body as {
      siteId?: string;
      messages?: Array<{ role: string; content: string }>;
    };

    if (!siteId || !messages?.length) {
      return NextResponse.json({ error: "siteId and messages required" }, { status: 400 });
    }

    const site = await prisma.wordPressSite.findUnique({
      where: { id: siteId },
      include: { user: true, chatbotConfig: true },
    });

    if (!site?.chatbotConfig?.isEnabled) {
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

    applyChatbotCorsHeaders(headers, allow);
    headers.set("Content-Type", "text/plain; charset=utf-8");

    const openai = getOpenAiClientForUser(site.user);
    const sys = site.chatbotConfig.systemPrompt || `You are a helpful assistant for ${site.chatbotConfig.businessName}. Be concise and friendly.`;

    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: sys },
        ...messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ],
      stream: true,
      max_tokens: 800,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const part of stream) {
            const token = part.choices[0]?.delta?.content;
            if (token) controller.enqueue(encoder.encode(token));
          }
        } catch (e) {
          controller.error(e);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, { headers });
  } catch (e) {
    if (e instanceof AiGateDeniedError) {
      return NextResponse.json({ error: e.message }, { status: 402 });
    }
    console.error("chatbot message", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
