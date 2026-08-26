import { NextResponse } from "next/server";
import { dispatchNextDeadmanXPost } from "@/lib/deadman-social";
import {
  getSupabaseServiceClient,
  isSupabaseServiceConfigured,
} from "@/lib/supabase/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(request: Request): boolean {
  const secret = process.env.DEADMAN_CRON_SECRET || process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") === `Bearer ${secret}`) {
    return true;
  }
  return request.headers.get("x-vercel-cron-schedule") !== null;
}

async function run(request: Request) {
  if (!authorized(request)) {
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
