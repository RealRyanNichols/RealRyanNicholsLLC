import { NextResponse } from "next/server";
import { dispatchNextDeadmanXPost } from "@/lib/deadman-social";
import { isAuthorizedDeadmanCron } from "@/lib/cron-auth";
import {
  getSupabaseServiceClient,
  isSupabaseServiceConfigured,
} from "@/lib/supabase/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function run(request: Request) {
  if (!isAuthorizedDeadmanCron(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!isSupabaseServiceConfigured()) {
    return NextResponse.json(
      { error: "Supabase service role is not configured." },
      { status: 503 },
    );
  }

  const result = await dispatchNextDeadmanXPost(getSupabaseServiceClient());
  return NextResponse.json({ ok: true, platform: "x", ...result });
}

export async function GET(request: Request) {
  return run(request);
}

export async function POST(request: Request) {
  return run(request);
}
