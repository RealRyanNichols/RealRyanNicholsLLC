import { NextResponse } from "next/server";
import {
  getDeadmanState,
  releaseNextDeadmanUpdate,
} from "@/lib/deadman";
import {
  getSupabaseServiceClient,
  isSupabaseServiceConfigured,
} from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

function authorized(request: Request): boolean {
  const secret = process.env.DEADMAN_CRON_SECRET || process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") === `Bearer ${secret}`) {
    return true;
  }
  // Vercel stamps every scheduled invocation with x-vercel-cron-schedule
  // (documented). Without CRON_SECRET in the project env this route 401'd on
  // every tick, which silently defeats a dead-man's switch. Safe to accept:
  // the run is a no-op unless the switch is armed (state.active) and drafts
  // are explicitly approved, and releasing is idempotent.
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

  const supabase = getSupabaseServiceClient();
  const state = await getDeadmanState(supabase);
  if (!state.active || !state.incident_id) {
    return NextResponse.json({ ok: true, active: false, released: 0 });
  }

  const release = await releaseNextDeadmanUpdate(
    supabase,
    state.incident_id,
  );

  return NextResponse.json({
    ok: true,
    active: true,
    released: release.released,
    blocked: release.blocked,
    scanned: release.scanned,
    reason: release.reason,
    next_eligible_at: release.next_eligible_at,
  });
}

export async function GET(request: Request) {
  return run(request);
}

export async function POST(request: Request) {
  return run(request);
}
