interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < 300000) return;
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) rateLimitStore.delete(key);
  }
  lastCleanup = now;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfterMs?: number;
}

function checkLimit(key: string, max: number, windowMs: number): RateLimitResult {
  cleanup();
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: max - 1, resetAt: new Date(now + windowMs) };
  }

  if (entry.count >= max) {
    return { allowed: false, remaining: 0, resetAt: new Date(entry.resetAt), retryAfterMs: entry.resetAt - now };
  }

  entry.count++;
  return { allowed: true, remaining: max - entry.count, resetAt: new Date(entry.resetAt) };
}

export function checkSessionRateLimit(sessionId: string): RateLimitResult {
  return checkLimit(`session:${sessionId}`, 30, 60000);
}

export function checkIpRateLimit(ip: string): RateLimitResult {
  return checkLimit(`ip:${ip}`, 60, 60000);
}

export function checkChatbotRateLimit(ip: string, sessionId: string): RateLimitResult {
  const ipResult = checkIpRateLimit(ip);
  if (!ipResult.allowed) return ipResult;
  const sessionResult = checkSessionRateLimit(sessionId);
  return sessionResult.remaining < ipResult.remaining ? sessionResult : ipResult;
}
