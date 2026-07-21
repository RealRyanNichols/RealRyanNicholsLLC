import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseStaticClient } from "@/lib/supabase/static";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  getSupabaseServiceClient,
  isSupabaseServiceConfigured,
} from "@/lib/supabase/service";
import { visitorHash } from "@/lib/visitor-hash";

// Beacon that records a page view with everything the client doesn't
// see — Vercel's geo headers (country / region / city), the canonical
// referrer host, a one-way first-party visitor hash for repeat-visitor
// counts without storing IPs, and a coarse device classifier.
// PageViewTracker sends dwell, scroll, and clicks through /api/track-event.

// Vercel populates x-vercel-ip-country/region/city on both runtimes.
// node lets us use node:crypto for the visitor hash without pulling in
// Web Crypto's async API for a tiny one-shot HMAC.
export const runtime = "nodejs";

const schema = z.object({
  session_id: z.string().min(8).max(64),
  visitor_id: z.string().min(8).max(80).nullable().optional(),
  path: z.string().min(1).max(500),
  ref: z.string().max(500).nullable().optional(),
  ua: z.string().max(300).nullable().optional(),
});

function parseHost(ref: string | null | undefined): string | null {
  if (!ref) return null;
  try {
    const u = new URL(ref);
    return u.host.toLowerCase().replace(/^www\./, "") || null;
  } catch {
    return null;
  }
}

// Crude device classifier — good enough for "is this a phone?"
// without dragging in a 200KB ua-parser.
function isKnownSyntheticGoogleVisit(
  ua: string | null | undefined,
  referrerHost: string | null,
): boolean {
  if (referrerHost !== "google.com" || !ua) return false;

  // This distributed crawler executes client JavaScript, forges a Google
  // referrer, and presents one fixed desktop Chrome signature. It generated
  // thousands of zero-dwell, zero-scroll visits and materially distorted the
  // human bounce rate. Keep the match deliberately narrow so ordinary Linux
  // readers and real Google search visitors remain classified as people.
  return (
    ua ===
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36"
  );
}

function classifyDevice(
  ua: string | null | undefined,
  referrerHost: string | null,
): string {
  if (!ua) return "unknown";
  if (isKnownSyntheticGoogleVisit(ua, referrerHost)) return "bot";
  const s = ua.toLowerCase();
  if (/bot|crawler|spider|preview|lighthouse|headless|http-client/.test(s))
    return "bot";
  if (/ipad|tablet|playbook/.test(s) || (/android/.test(s) && !/mobile/.test(s)))
    return "tablet";
  if (/mobile|iphone|ipod|android.*mobile|windows phone/.test(s))
    return "mobile";
  return "desktop";
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new NextResponse(null, { status: 204 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return new NextResponse(null, { status: 204 });
  }

  // Vercel populates these on the edge runtime. Locally / non-Vercel
  // they're missing; we just skip geo in that case.
  const h = request.headers;
  const country = h.get("x-vercel-ip-country") ?? null;
  const region = h.get("x-vercel-ip-country-region") ?? null;
  const city = h.get("x-vercel-ip-city")
    ? decodeURIComponent(h.get("x-vercel-ip-city")!)
    : null;
  // Forwarded-for is comma-separated; first entry is the original client.
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    null;

  const vh = visitorHash(parsed.data.visitor_id, ip, parsed.data.ua ?? null);
  const referrer_host = parseHost(parsed.data.ref ?? null);
  const device_kind = classifyDevice(parsed.data.ua ?? null, referrer_host);
  let userId: string | null = null;
  try {
    const authClient = await getSupabaseServerClient();
    const { data } = await authClient.auth.getUser();
    userId = data.user?.id ?? null;
  } catch {
    userId = null;
  }

  if (isSupabaseServiceConfigured()) {
    try {
      const service = getSupabaseServiceClient();
      const { data, error } = await service
        .from("page_views")
        .insert({
          session_id: parsed.data.session_id,
          user_id: userId,
          path: parsed.data.path.slice(0, 500),
          ref: parsed.data.ref?.slice(0, 500) || null,
          ua: parsed.data.ua?.slice(0, 300) || null,
          country: country?.slice(0, 8) || null,
          region: region?.slice(0, 120) || null,
          city: city?.slice(0, 120) || null,
          referrer_host: referrer_host?.slice(0, 200) || null,
          visitor_hash: vh,
          device_kind,
        })
        .select("id")
        .single();
      if (!error) {
        return NextResponse.json({ id: data?.id ?? null });
      }
    } catch {
      // Fall back to the public RPC below.
    }
  }

  let supabase: ReturnType<typeof getSupabaseStaticClient>;
  try {
    supabase = getSupabaseStaticClient();
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  const { data, error } = await supabase.rpc("record_page_view", {
    p_session_id: parsed.data.session_id,
    p_path: parsed.data.path,
    p_ref: parsed.data.ref ?? null,
    p_ua: parsed.data.ua ?? null,
    p_country: country,
    p_region: region,
    p_city: city,
    p_referrer_host: referrer_host,
    p_visitor_hash: vh,
    p_device_kind: device_kind,
  });
  if (error) {
    // Don't fail visibly to the client — beacons should never break
    // a page view.
    return new NextResponse(null, { status: 204 });
  }
  return NextResponse.json({ id: data });
}
