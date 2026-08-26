import { NextResponse } from "next/server";
import {
  getDeadmanState,
  releaseNextDeadmanUpdate,
} from "@/lib/deadman";
import { dispatchNextDeadmanXPost } from "@/lib/deadman-social";
import { isAuthorizedDeadmanCron } from "@/lib/cron-auth";
import { pingIndexNow } from "@/lib/indexnow";
import {
  getSupabaseServiceClient,
  isSupabaseServiceConfigured,
} from "@/lib/supabase/service";

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

  const supabase = getSupabaseServiceClient();
  const state = await getDeadmanState(supabase);
  if (!state.active || !state.incident_id) {
    return NextResponse.json({ ok: true, active: false, released: 0 });
  }

  const release = await releaseNextDeadmanUpdate(
    supabase,
    state.incident_id,
  );
  let releasedSlug: string | null = null;
  let releaseLookupFailed = false;
  if (release.released_ids[0]) {
    const { data: releasedUpdate, error: releasedUpdateError } = await supabase
      .from("deadman_updates")
      .select("slug")
      .eq("id", release.released_ids[0])
      .maybeSingle();
    releasedSlug = releasedUpdate?.slug ?? null;
    releaseLookupFailed = !!releasedUpdateError || !releasedSlug;
  }
  const [indexingResult, socialResult] = await Promise.allSettled([
    releasedSlug
      ? pingIndexNow([`/posts/${releasedSlug}`, "/", "/sitemap.xml"])
      : Promise.resolve(null),
    dispatchNextDeadmanXPost(supabase),
  ]);
  const sideEffectFailures = [
    releaseLookupFailed || indexingResult.status === "rejected" ? "indexing" : null,
    socialResult.status === "rejected" ? "x_dispatch" : null,
  ].filter((value): value is string => value !== null);
  if (sideEffectFailures.length) {
    await supabase.from("deadman_event_log").insert({
      incident_id: state.incident_id,
      event_type: "hourly_release_side_effect_attention",
      actor_id: "deadman-release-worker",
      detail: { failed_side_effects: sideEffectFailures },
    });
  }
  const social = socialResult.status === "fulfilled" ? socialResult.value : null;

  return NextResponse.json({
    ok: true,
    active: true,
    released: release.released,
    blocked: release.blocked,
    scanned: release.scanned,
    reason: release.reason,
    next_eligible_at: release.next_eligible_at,
    x_dispatch: social,
  });
}

export async function GET(request: Request) {
  return run(request);
}

export async function POST(request: Request) {
  return run(request);
}
