import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { assertReviewsPlan } from "@/lib/reviews-guard";

export const dynamic = "force-dynamic";

async function ensureSite(userId: string, wordpressSiteId: string) {
  return prisma.wordPressSite.findFirst({
    where: { id: wordpressSiteId, userId },
  });
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    assertReviewsPlan(user);
    const siteId = request.nextUrl.searchParams.get("wordpressSiteId");
    if (!siteId) {
      return NextResponse.json({ error: "wordpressSiteId required" }, { status: 400 });
    }
    const site = await ensureSite(user.id, siteId);
    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    const q = request.nextUrl.searchParams.get("q") || "";
    const contacts = await prisma.contact.findMany({
      where: {
        wordpressSiteId: siteId,
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        _count: { select: { reviewRequests: true } },
      },
    });

    return NextResponse.json({ data: contacts });
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
    const { wordpressSiteId, name, email, phone, serviceDate } = body;

    if (!wordpressSiteId || !name) {
      return NextResponse.json(
        { error: "wordpressSiteId and name are required" },
        { status: 400 }
      );
    }

    const site = await ensureSite(user.id, wordpressSiteId);
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

    if (email) {
      const cooldown = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const recent = await prisma.reviewRequest.findFirst({
        where: {
          wordpressSiteId,
          status: "sent",
          sentAt: { gte: cooldown },
          contact: { email: email.trim().toLowerCase() },
        },
      });
      if (recent) {
        return NextResponse.json(
          { error: "This email was contacted within the last 90 days." },
          { status: 400 }
        );
      }
    }

    const token = randomBytes(24).toString("hex");
    const contact = await prisma.contact.create({
      data: {
        wordpressSiteId,
        name,
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        serviceDate: serviceDate ? new Date(serviceDate) : null,
        source: "manual",
        unsubscribeToken: token,
      },
    });

    const delayMs = Math.max(0, (settings.delayHours ?? 3) * 3600 * 1000);
    const scheduledFor = new Date(Date.now() + delayMs);

    await prisma.reviewRequest.create({
      data: {
        contactId: contact.id,
        wordpressSiteId,
        channel: "email",
        status: "pending",
        messageType: "initial",
        scheduledFor,
      },
    });

    return NextResponse.json({ data: contact });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: msg.includes("plan") ? 402 : 500 });
  }
}
