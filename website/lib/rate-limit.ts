import { createHash } from "crypto";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

function hashIp(ip: string): string {
  const salt =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    "";
  return createHash("sha256").update(`${salt}|${ip}`).digest("hex");
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

export type RateLimitResult =
  | { ok: true; ipHash: string }
  | { ok: false; error: string; retryAfterSec: number };

// Check + record a rate-limit hit. Returns `{ ok: false }` once the
// caller is over the threshold. Buckets are arbitrary string keys.
export async function checkRateLimit(opts: {
  request: Request;
  bucket: string;
  windowMinutes: number;
  maxRequests: number;
  userId?: string | null;
}): Promise<RateLimitResult> {
  const ipHash = hashIp(clientIp(opts.request));
  const supabase = getSupabaseServiceClient();
  const windowStart = new Date(
    Date.now() - opts.windowMinutes * 60 * 1000,
  ).toISOString();

  // Count by IP — cheap, single indexed query
  const ipPromise = supabase
    .from("rate_limit_hits")
    .select("id", { count: "exact", head: true })
    .eq("bucket", opts.bucket)
    .eq("ip_hash", ipHash)
    .gte("created_at", windowStart);

  // If we have a user_id, also count by user. This stops one attacker
  // from rotating IPs to bypass.
  const userPromise = opts.userId
    ? supabase
        .from("rate_limit_hits")
        .select("id", { count: "exact", head: true })
        .eq("bucket", opts.bucket)
        .eq("user_id", opts.userId)
        .gte("created_at", windowStart)
    : Promise.resolve({ count: 0 });

  const [{ count: ipCount }, { count: userCount }] = await Promise.all([
    ipPromise,
    userPromise,
  ]);

  if (
    (ipCount ?? 0) >= opts.maxRequests ||
    (userCount ?? 0) >= opts.maxRequests
  ) {
    return {
      ok: false,
      error: "Too many requests. Slow down — try again in a bit.",
      retryAfterSec: opts.windowMinutes * 60,
    };
  }

  await supabase.from("rate_limit_hits").insert({
    bucket: opts.bucket,
    ip_hash: ipHash,
    user_id: opts.userId ?? null,
  });

  return { ok: true, ipHash };
}
