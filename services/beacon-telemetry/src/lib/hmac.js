import { createHmac, timingSafeEqual } from 'node:crypto';

const HMAC_KEY = process.env.KAI_HMAC_KEY || process.env.TELEMETRY_HMAC_KEY || 'mb-telem-v1-2026';
const WINDOW_SECONDS = 300;

export function sign(plugin, eventType, userLocal, ts) {
  return createHmac('sha256', HMAC_KEY)
    .update(`${plugin}${eventType}${userLocal}${ts}`)
    .digest('hex');
}

export function verify(plugin, eventType, userLocal, ts, sig) {
  if (!sig || ts === undefined || ts === null) return false;
  const tsNum = Number(ts);
  if (!Number.isFinite(tsNum)) return false;
  const age = Math.abs(Date.now() / 1000 - tsNum);
  if (age > WINDOW_SECONDS) return false;

  const expected = sign(plugin, eventType, userLocal, ts);
  let a, b;
  try {
    a = Buffer.from(String(sig), 'hex');
    b = Buffer.from(expected, 'hex');
  } catch {
    return false;
  }
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
