import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/auth";

// SSRF Prevention: Block private/internal IPs
const BLOCKED_IP_RANGES = [
  /^127\./,                    // Loopback
  /^10\./,                     // Private Class A
  /^172\.(1[6-9]|2\d|3[01])\./, // Private Class B
  /^192\.168\./,               // Private Class C
  /^169\.254\./,               // Link-local
  /^0\./,                      // Current network
  /^fc00:/i,                   // IPv6 unique local
  /^fe80:/i,                   // IPv6 link-local
  /^::1$/,                     // IPv6 loopback
  /^fd/i,                      // IPv6 private
];

const BLOCKED_HOSTNAMES = [
  "localhost",
  "metadata.google.internal",
  "169.254.169.254",           // Cloud metadata endpoints
  "metadata.internal",
];

function isUrlSafe(urlString: string): { safe: boolean; reason?: string } {
  try {
    const url = new URL(urlString);

    // Only allow http and https
    if (!["http:", "https:"].includes(url.protocol)) {
      return { safe: false, reason: "Only HTTP/HTTPS protocols are allowed" };
    }

    // Block known dangerous hostnames
    if (BLOCKED_HOSTNAMES.includes(url.hostname.toLowerCase())) {
      return { safe: false, reason: "This hostname is not allowed" };
    }

    // Block private IP ranges
    for (const pattern of BLOCKED_IP_RANGES) {
      if (pattern.test(url.hostname)) {
        return { safe: false, reason: "Internal IP addresses are not allowed" };
      }
    }

    return { safe: true };
  } catch {
    return { safe: false, reason: "Invalid URL" };
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    await requireAuth();

    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // SSRF check
    const safety = isUrlSafe(url);
    if (!safety.safe) {
      return NextResponse.json({ error: safety.reason }, { status: 400 });
    }

    const startTime = Date.now();

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SEOAuditBot/1.0; +https://seoaudit.app)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      redirect: "follow",
    });

    const responseTime = Date.now() - startTime;
    const html = await response.text();

    // Extract headers we care about
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    return NextResponse.json({
      html,
      finalUrl: response.url,
      statusCode: response.status,
      headers,
      responseTime,
    });
  } catch (error: unknown) {
    console.error("[Proxy Fetch] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch URL" },
      { status: 500 }
    );
  }
}
