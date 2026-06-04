import { NextResponse } from "next/server";
import {
  getDeadmanState,
  releaseApprovedDeadmanDrafts,
  saveDeadmanState,
} from "@/lib/deadman";
import {
  getSupabaseServiceClient,
  isSupabaseServiceConfigured,
} from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

function authorized(request: Request): boolean {
  const secret = process.env.DEADMAN_CRON_SECRET || process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
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

  const supabase = getSupabaseServiceClient();
  const state = await getDeadmanState(supabase);
  if (!state.active) {
    return NextResponse.json({ ok: true, active: false, released: 0 });
  }

  const release = await releaseApprovedDeadmanDrafts(supabase);
  const now = new Date().toISOString();
  await saveDeadmanState(supabase, {
    ...state,
    last_release_at: now,
    total_released: state.total_released + release.released,
  });

  return NextResponse.json({
    ok: true,
    active: true,
    released: release.released,
    blocked: release.blocked,
    scanned: release.scanned,
  });
}

export async function GET(request: Request) {
  return run(request);
}

export async function POST(request: Request) {
  return run(request);
}
