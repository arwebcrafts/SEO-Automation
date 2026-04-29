/**
 * Returns Access-Control-Allow-Origin value when the request origin host
 * is allowed for the site, otherwise null.
 */
export function corsAllowOrigin(
  originHeader: string | null,
  allowedDomains: string[]
): string | null {
  if (!originHeader || allowedDomains.length === 0) return null;
  try {
    const url = new URL(originHeader);
    const host = url.hostname.toLowerCase();
    const normalized = allowedDomains.map((d) => d.toLowerCase().replace(/^https?:\/\//, "").split("/")[0] ?? "");
    const ok = normalized.some((allowed) => allowed === host || host.endsWith(`.${allowed}`));
    if (!ok) return null;
    return originHeader;
  } catch {
    return null;
  }
}

export function applyChatbotCorsHeaders(
  headers: Headers,
  allowOrigin: string | null
): void {
  if (allowOrigin) {
    headers.set("Access-Control-Allow-Origin", allowOrigin);
    headers.set("Vary", "Origin");
  }
}
