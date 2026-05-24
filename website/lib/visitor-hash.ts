import { createHmac } from "crypto";

export function hashVisitorId(visitorId: string): string {
  const salt =
    process.env.VISITOR_HASH_SALT ?? "realryannichols-default-rotate-salt";
  return createHmac("sha256", `${salt}:visitor`)
    .update(visitorId)
    .digest("hex")
    .slice(0, 32);
}

export function hashDailyIpUa(ip: string, ua: string | null | undefined): string {
  const salt =
    process.env.VISITOR_HASH_SALT ?? "realryannichols-default-rotate-salt";
  const day = new Date().toISOString().slice(0, 10);
  return createHmac("sha256", `${salt}:${day}`)
    .update(`${ip}|${ua ?? ""}`)
    .digest("hex")
    .slice(0, 24);
}

export function visitorHash(
  visitorId: string | null | undefined,
  ip: string | null,
  ua: string | null | undefined,
): string | null {
  if (visitorId) return hashVisitorId(visitorId);
  if (!ip) return null;
  return hashDailyIpUa(ip, ua);
}

