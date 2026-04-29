import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return new NextResponse("Missing token", { status: 400 });
  }

  const contact = await prisma.contact.findFirst({
    where: { unsubscribeToken: token },
  });

  if (!contact) {
    return new NextResponse("Invalid link", { status: 404 });
  }

  await prisma.contact.update({
    where: { id: contact.id },
    data: { optedOut: true },
  });

  return new NextResponse(
    `<!DOCTYPE html><html><body style="font-family:system-ui;padding:2rem;">You have been unsubscribed from review requests.</body></html>`,
    {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    }
  );
}
