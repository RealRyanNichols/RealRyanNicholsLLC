import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServiceClient, isSupabaseServiceConfigured } from "@/lib/supabase/service";
import { readToken } from "@/lib/biglie/token";
import { SITE } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const email = readToken(request.nextUrl.searchParams.get("t"));
  const done = new URL("/thebiglie/answered", SITE.url);
  done.searchParams.set("status", "stopped");

  if (email && isSupabaseServiceConfigured()) {
    try {
      const supabase = getSupabaseServiceClient();
      await supabase
        .from("biglie_sequence_state")
        .update({ stopped: true, stopped_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("email", email);
    } catch {
      // still show the confirmation
    }
  }
  return NextResponse.redirect(done);
}
