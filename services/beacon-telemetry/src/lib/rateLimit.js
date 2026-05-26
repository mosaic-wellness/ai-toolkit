const WINDOW_MS = 60_000;
const MAX_REQ = 30;

const rateMap = new Map();

export function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (entry && entry.reset > now) {
    if (entry.count >= MAX_REQ) return false;
    entry.count++;
    return true;
  }
  rateMap.set(ip, { count: 1, reset: now + WINDOW_MS });
  return true;
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateMap) {
    if (entry.reset <= now) rateMap.delete(ip);
  }
}, 300_000).unref?.();
