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
  if (release.released_ids[0]) {
    const { data: releasedUpdate } = await supabase
      .from("deadman_updates")
      .select("slug")
      .eq("id", release.released_ids[0])
      .maybeSingle();
    if (releasedUpdate?.slug) {
      await pingIndexNow([`/posts/${releasedUpdate.slug}`, "/", "/sitemap.xml"]);
    }
  }
  const social = await dispatchNextDeadmanXPost(supabase).catch(() => null);

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
