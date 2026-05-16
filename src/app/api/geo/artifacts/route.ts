import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const { domain, location, type } = await request.json();

    // Generate GEO artifacts (schema markup, local business JSON-LD, etc.)
    const artifacts = {
      localBusinessSchema: {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": domain,
        "address": { "@type": "PostalAddress", "addressLocality": location },
        "url": `https://${domain}`,
      },
      robotsTxt: `User-agent: *\nAllow: /\nSitemap: https://${domain}/sitemap.xml`,
      localSitemap: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>https://${domain}/</loc></url>\n  <url><loc>https://${domain}/${location.toLowerCase().replace(/\s+/g, "-")}</loc></url>\n</urlset>`,
    };

    return NextResponse.json({ artifacts });
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate artifacts" }, { status: 500 });
  }
}
