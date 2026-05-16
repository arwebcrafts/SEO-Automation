import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const { domain, locations, type = "all" } = await request.json();

    if (!domain || !locations?.length) {
      return NextResponse.json({ error: "Domain and locations required" }, { status: 400 });
    }

    const files = locations.map((loc: string) => {
      const slug = loc.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      return {
        filename: `${slug}.html`,
        location: loc,
        content: `<!-- Location page for ${loc} -->\n<h1>${domain} in ${loc}</h1>\n<p>Professional services in ${loc}.</p>`,
        schema: { "@context": "https://schema.org", "@type": "LocalBusiness", "name": domain, "address": { "@type": "PostalAddress", "addressLocality": loc } },
      };
    });

    return NextResponse.json({ files, count: files.length });
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate files" }, { status: 500 });
  }
}
