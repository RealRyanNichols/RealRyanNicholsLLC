import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase/service";
import { SITE } from "@/lib/site";

async function processToken(token: string | null): Promise<string> {
  if (!token) {
    return new URL("/unsubscribed?status=invalid", SITE.url).toString();
  }
  let supabase: ReturnType<typeof getSupabaseServiceClient>;
  try {
    supabase = getSupabaseServiceClient();
  } catch {
    return new URL("/unsubscribed?status=invalid", SITE.url).toString();
  }

  const { data, error } = await supabase.rpc("unsubscribe_signup", { p_token: token });
  if (error || !data || data.length === 0 || !data[0].success) {
    return new URL("/unsubscribed?status=invalid", SITE.url).toString();
  }
  return new URL("/unsubscribed?status=ok", SITE.url).toString();
}

export async function GET(request: NextRequest) {
  const target = await processToken(request.nextUrl.searchParams.get("token"));
  return NextResponse.redirect(target);
}

// One-click unsubscribe per RFC 8058 — mail clients POST to the
// List-Unsubscribe URL with `List-Unsubscribe=One-Click` in the body.
export async function POST(request: NextRequest) {
  let token = request.nextUrl.searchParams.get("token");
  if (!token) {
    try {
      const body = await request.text();
      const params = new URLSearchParams(body);
      token = params.get("token");
    } catch {
      // ignore
    }
  }
  await processToken(token);
  return NextResponse.json({ ok: true });
}
