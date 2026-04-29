import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { encryptSecret, decryptSecret, maskSecret } from "@/lib/encryption";
import OpenAI from "openai";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireAuth();
    const fresh = await prisma.user.findUnique({ where: { id: user.id } });
    if (!fresh) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json({
      openaiApiKey: fresh.openaiApiKeyEncrypted ? "••••••••" : "",
      sendgridApiKey: fresh.sendgridApiKeyEncrypted ? "••••••••" : "",
      hasOpenai: !!fresh.openaiApiKeyEncrypted,
      hasSendgrid: !!fresh.sendgridApiKeyEncrypted,
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
    const body = await request.json();
    const { openaiApiKey, sendgridApiKey } = body as {
      openaiApiKey?: string;
      sendgridApiKey?: string;
    };

    const data: { openaiApiKeyEncrypted?: string; sendgridApiKeyEncrypted?: string } = {};

    if (typeof openaiApiKey === "string") {
      const v = openaiApiKey.trim();
      if (v && !v.startsWith("•")) {
        data.openaiApiKeyEncrypted = encryptSecret(v);
      }
    }
    if (typeof sendgridApiKey === "string") {
      const v = sendgridApiKey.trim();
      if (v && !v.includes("•")) {
        data.sendgridApiKeyEncrypted = encryptSecret(v);
      }
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data,
    });

    return NextResponse.json({
      ok: true,
      openaiApiKey: updated.openaiApiKeyEncrypted ? maskSecret("x".repeat(20)) : "",
      sendgridApiKey: updated.sendgridApiKeyEncrypted ? maskSecret("x".repeat(20)) : "",
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error" },
      { status: 500 }
    );
  }
}

/** Optional: verify OpenAI key */
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    if (body.testOpenai) {
      const fresh = await prisma.user.findUnique({ where: { id: user.id } });
      if (!fresh?.openaiApiKeyEncrypted) {
        return NextResponse.json({ ok: false, error: "No key stored" }, { status: 400 });
      }
      const key = decryptSecret(fresh.openaiApiKeyEncrypted);
      const client = new OpenAI({ apiKey: key });
      await client.models.list();
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Unknown test" }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Error" },
      { status: 400 }
    );
  }
}
