import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseStaticClient } from "@/lib/supabase/static";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  getSupabaseServiceClient,
  isSupabaseServiceConfigured,
} from "@/lib/supabase/service";

// Server-side sink for engagement events + scroll/dwell heartbeats.
// The client hits this with navigator.sendBeacon (which survives page
// navigation and unload, unlike a fire-and-forget supabase.rpc from the
// browser). If a service-role key is present, writes include the signed-in
// user id. Otherwise the route falls back to the public RPCs with tight input
// validation and RLS-protected tables.
//
// Two shapes, distinguished by `kind`:
//   { session_id, path, kind, target }  -> record_page_event  (a click)
//   { session_id, path, scroll }        -> touch_page_view_by_session (dwell)
// A click payload also carries scroll, so one beacon does both.

export const runtime = "nodejs";

const schema = z.object({
  session_id: z.string().min(8).max(64),
  path: z.string().min(1).max(500),
  kind: z.string().max(50).nullable().optional(),
  target: z.string().max(500).nullable().optional(),
  scroll: z.number().int().min(0).max(100).nullable().optional(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    // sendBeacon sends a Blob; if it didn't parse, nothing to do.
    return new NextResponse(null, { status: 204 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return new NextResponse(null, { status: 204 });
  }
  const { session_id, path, kind, target, scroll } = parsed.data;
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
      const update = service
        .from("page_views")
        .update({
          last_activity_at: new Date().toISOString(),
          ...(typeof scroll === "number" ? { scroll_max: scroll } : {}),
        })
        .eq("session_id", session_id)
        .eq("path", path);

      const event =
        kind && kind.length > 0
          ? service.from("page_events").insert({
              session_id,
              user_id: userId,
              kind: kind.slice(0, 50),
              target: target?.slice(0, 500) || null,
              path: path.slice(0, 500),
            })
          : Promise.resolve();

      await Promise.allSettled([update, event]);
      return new NextResponse(null, { status: 204 });
    } catch {
      // Fall back to the public RPC path below.
    }
  }

  let supabase: ReturnType<typeof getSupabaseStaticClient>;
  try {
    supabase = getSupabaseStaticClient();
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  // Always refresh dwell/scroll for this session+path.
  const touch = supabase.rpc("touch_page_view_by_session", {
    p_session_id: session_id,
    p_path: path,
    p_scroll_max: scroll ?? null,
  });

  // If this beacon represents a click/outbound/named event, log it too.
  const event =
    kind && kind.length > 0
      ? supabase.rpc("record_page_event", {
          p_session_id: session_id,
          p_kind: kind,
          p_target: target ?? null,
          p_path: path,
        })
      : Promise.resolve();

  // Never block or surface errors to a beacon — best-effort.
  await Promise.allSettled([touch, event]);
  return new NextResponse(null, { status: 204 });
}
