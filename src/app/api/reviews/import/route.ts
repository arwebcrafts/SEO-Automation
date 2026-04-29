import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import Papa from "papaparse";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { assertReviewsPlan } from "@/lib/reviews-guard";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    assertReviewsPlan(user);
    const body = await request.json();
    const { wordpressSiteId, csv } = body as { wordpressSiteId?: string; csv?: string };

    if (!wordpressSiteId || !csv) {
      return NextResponse.json(
        { error: "wordpressSiteId and csv text required" },
        { status: 400 }
      );
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

    const parsed = Papa.parse<Record<string, string>>(csv, {
      header: true,
      skipEmptyLines: true,
    });

    let imported = 0;
    let skipped = 0;
    const cooldown = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const staggerMs = 2 * 60 * 1000;

    for (let i = 0; i < parsed.data.length; i++) {
      const row = parsed.data[i];
      const name = (row.name || row.Name || row.NAME || "").trim();
      const email = (row.email || row.Email || row.EMAIL || "").trim().toLowerCase();
      if (!name || !email) {
        skipped++;
        continue;
      }

      const recent = await prisma.reviewRequest.findFirst({
        where: {
          wordpressSiteId,
          status: "sent",
          sentAt: { gte: cooldown },
          contact: { email },
        },
      });
      if (recent) {
        skipped++;
        continue;
      }

      const token = randomBytes(24).toString("hex");
      const contact = await prisma.contact.create({
        data: {
          wordpressSiteId,
          name,
          email,
          phone: (row.phone || row.Phone || "").trim() || null,
          source: "csv_import",
          unsubscribeToken: token,
        },
      });

      const delayMs = Math.max(0, (settings.delayHours ?? 3) * 3600 * 1000);
      const scheduledFor = new Date(Date.now() + delayMs + i * staggerMs);

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
      imported++;
    }

    return NextResponse.json({ imported, skipped });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: msg.includes("plan") ? 402 : 500 });
  }
}
