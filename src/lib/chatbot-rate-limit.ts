const buckets = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 30;

export function rateLimitChatbot(siteId: string, ip: string): boolean {
  const key = `${siteId}:${ip}`;
  const now = Date.now();
  const arr = buckets.get(key) ?? [];
  const fresh = arr.filter((t) => now - t < WINDOW_MS);
  if (fresh.length >= MAX_PER_WINDOW) return false;
  fresh.push(now);
  buckets.set(key, fresh);
  return true;
}
