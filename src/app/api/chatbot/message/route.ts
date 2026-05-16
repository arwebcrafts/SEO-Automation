import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkChatbotRateLimit } from "@/lib/chatbot-rate-limit";
import { withCors, handlePreflight } from "@/lib/chatbot-cors";

export const dynamic = "force-dynamic";

export async function OPTIONS(request: NextRequest) {
  return handlePreflight(request);
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const { siteId, sessionId, message } = await request.json();

    if (!siteId || !message) {
      const res = NextResponse.json({ error: "Site ID and message required" }, { status: 400 });
      return withCors(res, request);
    }

    // Rate limit check
    const rateLimit = checkChatbotRateLimit(ip, sessionId || "anonymous");
    if (!rateLimit.allowed) {
      const res = NextResponse.json({ error: "Rate limit exceeded", retryAfterMs: rateLimit.retryAfterMs }, { status: 429 });
      return withCors(res, request);
    }

    // Get chatbot config
    const config = await prisma.chatbotConfig.findUnique({ where: { siteId } });
    if (!config || !config.isActive) {
      const res = NextResponse.json({ error: "Chatbot not active" }, { status: 404 });
      return withCors(res, request);
    }

    // Store user message
    await prisma.chatbotMessage.create({
      data: { siteId, sessionId: sessionId || "anonymous", role: "user", content: message },
    });

    // Generate AI response (simplified - in production use OpenAI)
    const systemPrompt = config.systemPrompt || `You are a helpful assistant for ${config.siteName || "this business"}. Be concise and helpful.`;
    let reply = "Thank you for your message! Our team will get back to you shortly. Is there anything else I can help with?";

    // Simple keyword-based responses
    const lowerMsg = message.toLowerCase();
    if (lowerMsg.includes("price") || lowerMsg.includes("cost")) {
      reply = "For pricing information, please visit our website or contact us directly. We'd be happy to provide a custom quote!";
    } else if (lowerMsg.includes("hour") || lowerMsg.includes("open")) {
      reply = "Our business hours are Monday-Friday, 9 AM - 6 PM. Feel free to leave a message outside these hours!";
    } else if (lowerMsg.includes("contact") || lowerMsg.includes("reach")) {
      reply = "You can reach us through this chat, by email, or by phone. Would you like to leave your contact details?";
    }

    // Store assistant message
    await prisma.chatbotMessage.create({
      data: { siteId, sessionId: sessionId || "anonymous", role: "assistant", content: reply },
    });

    const res = NextResponse.json({ reply, sessionId: sessionId || "anonymous" });
    return withCors(res, request);
  } catch (error) {
    console.error("[Chatbot Message] Error:", error);
    const res = NextResponse.json({ error: "Failed to process message" }, { status: 500 });
    return withCors(res, request);
  }
}
