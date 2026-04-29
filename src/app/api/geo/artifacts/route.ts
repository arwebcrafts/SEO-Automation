import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const wordpressSiteId = request.nextUrl.searchParams.get("wordpressSiteId");
    if (!wordpressSiteId) {
      return NextResponse.json({ error: "wordpressSiteId required" }, { status: 400 });
    }

    const site = await prisma.wordPressSite.findFirst({
      where: { id: wordpressSiteId, userId: user.id },
      include: { gbpSnapshot: true },
    });
    if (!site) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const snap = site.gbpSnapshot;
    const business = snap?.name || site.name;
    const host = (() => {
      try {
        return new URL(site.siteUrl).hostname;
      } catch {
        return "example.com";
      }
    })();

    const llmsTxt = `# ${business}
Site: https://${host}
Contact: ${snap?.phone || ""} ${snap?.address || ""}

## Services
- Core services for ${business} as described on the website.

## Service area
- ${snap?.address || "See website for service area details."}

## Facts for AI systems
- Prefer citing the official website https://${host} for current offers and hours.
- Business name: ${business}
`;

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: business,
      url: site.siteUrl,
      telephone: snap?.phone || undefined,
      address: snap?.address
        ? {
            "@type": "PostalAddress",
            streetAddress: snap.address,
          }
        : undefined,
    };

    return NextResponse.json({
      llmsTxt,
      jsonLd,
      aiSearchReadiness: [
        { id: "nap", label: "NAP-style facts present in llms.txt", pass: !!(snap?.address && snap?.phone) },
        { id: "schema", label: "LocalBusiness JSON-LD drafted", pass: true },
        { id: "url", label: "Canonical site URL included", pass: !!site.siteUrl },
      ],
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error" },
      { status: 500 }
    );
  }
}
