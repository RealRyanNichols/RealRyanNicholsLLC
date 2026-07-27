import { createHmac, timingSafeEqual } from "crypto";

/**
 * Signed subscriber tokens for The BIG Lie 30-day sequence.
 *
 * Poll answers and stop links arrive as plain GET clicks from email clients,
 * so the subscriber identity travels as `base64url(email).hmac`. The secret
 * derives from SUPABASE_SERVICE_ROLE_KEY (already present in the runtime) so
 * no new environment variable is required; BIGLIE_TOKEN_SECRET overrides it
 * if Ryan ever wants to rotate independently.
 */
function secret(): string {
  const s =
    process.env.BIGLIE_TOKEN_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "";
  if (!s) throw new Error("No signing secret available for biglie tokens.");
  return `biglie:${s}`;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url").slice(0, 24);
}

export function makeToken(email: string): string {
  const e = Buffer.from(email.toLowerCase().trim()).toString("base64url");
  return `${e}.${sign(e)}`;
}

export function readToken(token: string | null): string | null {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot < 1) return null;
  const e = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  const want = sign(e);
  const a = Buffer.from(mac);
  const b = Buffer.from(want);
  if (a.length !== b.length) return null;
  try {
    if (!timingSafeEqual(a, b)) return null;
    const email = Buffer.from(e, "base64url").toString("utf8");
    if (!email.includes("@") || email.length > 254) return null;
    return email.toLowerCase();
  } catch {
    return null;
  }
}
