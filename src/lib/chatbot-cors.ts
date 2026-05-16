import { NextRequest, NextResponse } from "next/server";

/**
 * Create CORS headers for chatbot widget requests
 */
export function createCorsHeaders(origin: string | null, allowedDomains?: string[]): HeadersInit {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Site-Id",
    "Access-Control-Max-Age": "86400",
  };

  if (!origin) {
    return headers;
  }

  // If no domain restriction, allow all
  if (!allowedDomains || allowedDomains.length === 0) {
    headers["Access-Control-Allow-Origin"] = "*";
    return headers;
  }

  // Check if origin is in allowed domains
  try {
    const originUrl = new URL(origin);
    const originDomain = originUrl.hostname;

    const isAllowed = allowedDomains.some((domain) => {
      // Support wildcard subdomains: *.example.com
      if (domain.startsWith("*.")) {
        const baseDomain = domain.slice(2);
        return originDomain === baseDomain || originDomain.endsWith(`.${baseDomain}`);
      }
      return originDomain === domain;
    });

    if (isAllowed) {
      headers["Access-Control-Allow-Origin"] = origin;
      headers["Vary"] = "Origin";
    }
  } catch {
    // Invalid origin URL, don't add CORS header
  }

  return headers;
}

/**
 * Handle OPTIONS preflight request
 */
export function handlePreflight(request: NextRequest, allowedDomains?: string[]): NextResponse {
  const origin = request.headers.get("origin");
  const headers = createCorsHeaders(origin, allowedDomains);

  return new NextResponse(null, {
    status: 204,
    headers,
  });
}

/**
 * Wrap a response with CORS headers
 */
export function withCors(
  response: NextResponse,
  request: NextRequest,
  allowedDomains?: string[]
): NextResponse {
  const origin = request.headers.get("origin");
  const corsHeaders = createCorsHeaders(origin, allowedDomains);

  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

/**
 * Validate that a request comes from an allowed domain
 */
export function isOriginAllowed(origin: string | null, allowedDomains: string[]): boolean {
  if (!origin) return false;
  if (allowedDomains.length === 0) return true;

  try {
    const originUrl = new URL(origin);
    const originDomain = originUrl.hostname;

    return allowedDomains.some((domain) => {
      if (domain.startsWith("*.")) {
        const baseDomain = domain.slice(2);
        return originDomain === baseDomain || originDomain.endsWith(`.${baseDomain}`);
      }
      return originDomain === domain;
    });
  } catch {
    return false;
  }
}
