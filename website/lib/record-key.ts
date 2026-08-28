import { createHmac, timingSafeEqual } from "crypto";

// The archive key.
//
// A visitor who leaves a working email gets a signed cookie and the whole
// archive opens — this file and every other one — with no account, no
// password, and no confirmation click sitting between them and the record.
// The cookie is signed so it cannot be forged, and it carries nothing but
// the address they already gave us.

export const RECORD_COOKIE = "rrn_record_key";
export const RECORD_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // a year

function secret(): string | null {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? null;
}

function sign(value: string, key: string): string {
  return createHmac("sha256", key).update(value).digest("base64url");
}

export function mintRecordKey(email: string): string | null {
  const key = secret();
  if (!key) return null;
  const payload = Buffer.from(email.toLowerCase()).toString("base64url");
  return `${payload}.${sign(payload, key)}`;
}

export function readRecordKey(cookieValue: string | undefined): string | null {
  if (!cookieValue) return null;
  const key = secret();
  if (!key) return null;
  const [payload, mac] = cookieValue.split(".");
  if (!payload || !mac) return null;
  const expected = sign(payload, key);
  try {
    const a = Buffer.from(mac);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  try {
    return Buffer.from(payload, "base64url").toString("utf8") || null;
  } catch {
    return null;
  }
}
