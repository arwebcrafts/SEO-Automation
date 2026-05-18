import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encrypt, decrypt, generateApiKey, maskKey } from "@/lib/encryption";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireAuth();
    const keys = await prisma.userApiKey.findMany({ where: { userId: user.id } });
    return NextResponse.json({
      keys: keys.map((k) => ({ id: k.id, provider: k.provider, label: k.label, maskedKey: maskKey(decrypt(k.encryptedKey)), isActive: k.isActive, lastUsedAt: k.lastUsedAt, createdAt: k.createdAt })),
    });
  } catch (error: unknown) {
    return handleApiError(error, "Failed to fetch keys");
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { provider, apiKey, label } = await request.json();

    if (!provider || !apiKey) return NextResponse.json({ error: "Provider and API key required" }, { status: 400 });

    const key = await prisma.userApiKey.upsert({
      where: { userId_provider: { userId: user.id, provider } },
      create: { userId: user.id, provider, encryptedKey: encrypt(apiKey), label },
      update: { encryptedKey: encrypt(apiKey), label },
    });

    return NextResponse.json({ success: true, id: key.id, maskedKey: maskKey(apiKey) });
  } catch (error: unknown) {
    return handleApiError(error, "Failed to save key");
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await prisma.userApiKey.deleteMany({ where: { id, userId: user.id } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return handleApiError(error, "Failed to delete key");
  }
}
