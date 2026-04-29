import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { assertReviewsPlan } from "@/lib/reviews-guard";
import { maskSecret } from "@/lib/encryption";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    assertReviewsPlan(user);
    const wordpressSiteId = request.nextUrl.searchParams.get("wordpressSiteId");
    if (!wordpressSiteId) {
      return NextResponse.json({ error: "wordpressSiteId required" }, { status: 400 });
    }
    const site = await prisma.wordPressSite.findFirst({
      where: { id: wordpressSiteId, userId: user.id },
    });
    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    let settings = await prisma.reviewSettings.findUnique({
      where: { wordpressSiteId },
    });
    if (!settings) {
      settings = await prisma.reviewSettings.create({
        data: { wordpressSiteId },
      });
    }

    return NextResponse.json({
      data: {
        ...settings,
        sendgridApiKey: settings.sendgridApiKey
          ? maskSecret(settings.sendgridApiKey)
          : "",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: msg.includes("plan") ? 402 : 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    assertReviewsPlan(user);
    const body = await request.json();
    const { wordpressSiteId, ...rest } = body;
    if (!wordpressSiteId) {
      return NextResponse.json({ error: "wordpressSiteId required" }, { status: 400 });
    }
    const site = await prisma.wordPressSite.findFirst({
      where: { id: wordpressSiteId, userId: user.id },
    });
    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    const data: Record<string, unknown> = { ...rest };
    if (typeof data.sendgridApiKey === "string") {
      const v = data.sendgridApiKey.trim();
      if (!v || v.includes("•")) {
        delete data.sendgridApiKey;
      }
    }

    const settings = await prisma.reviewSettings.upsert({
      where: { wordpressSiteId },
      create: {
        wordpressSiteId,
        ...(data as object),
      },
      update: data as object,
    });

    return NextResponse.json({
      data: {
        ...settings,
        sendgridApiKey: settings.sendgridApiKey
          ? maskSecret(settings.sendgridApiKey)
          : "",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: msg.includes("plan") ? 402 : 500 });
  }
}
