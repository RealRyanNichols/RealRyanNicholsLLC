import { getSupabaseStaticClient } from "@/lib/supabase/static";
import { SITE } from "@/lib/site";
import type { LiveStream } from "@/lib/types";

export const LIVE_STREAM_COLUMNS =
  "id, slug, title, description, category, status, provider, mux_live_stream_id, mux_playback_id, mux_status, mux_asset_id, announce_count, last_announced_at, created_by, started_at, ended_at, created_at, updated_at";

export function liveUrl(slug: string): string {
  return `${SITE.url}/live/${slug}`;
}

export function slugifyLiveTitle(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
  return `${base || "live"}-${Date.now().toString(36)}`;
}

export function liveStatusLabel(status: LiveStream["status"]): string {
  if (status === "live") return "Live now";
  if (status === "scheduled") return "Live room ready";
  if (status === "ended") return "Stream ended";
  if (status === "disabled") return "Disabled";
  return "Needs attention";
}

export async function getActiveLiveStream(): Promise<LiveStream | null> {
  const supabase = getSupabaseStaticClient();
  const { data, error } = await supabase
    .from("live_streams")
    .select(LIVE_STREAM_COLUMNS)
    .in("status", ["live", "scheduled"])
    .not("mux_playback_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(8);

  if (error) {
    console.error("getActiveLiveStream:", error);
    return null;
  }

  const streams = (data ?? []) as LiveStream[];
  return (
    streams.sort((a, b) => {
      const priority = (s: LiveStream["status"]) => (s === "live" ? 0 : 1);
      return priority(a.status) - priority(b.status);
    })[0] ?? null
  );
}

export async function getLiveStreamBySlug(
  slug: string
): Promise<LiveStream | null> {
  const supabase = getSupabaseStaticClient();
  const { data, error } = await supabase
    .from("live_streams")
    .select(LIVE_STREAM_COLUMNS)
    .eq("slug", slug)
    .in("status", ["scheduled", "live", "ended"])
    .maybeSingle();

  if (error) {
    console.error("getLiveStreamBySlug:", error);
    return null;
  }
  return (data ?? null) as LiveStream | null;
}

export async function getPublicLiveStreams(): Promise<LiveStream[]> {
  const supabase = getSupabaseStaticClient();
  const { data, error } = await supabase
    .from("live_streams")
    .select(LIVE_STREAM_COLUMNS)
    .in("status", ["scheduled", "live", "ended"])
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("getPublicLiveStreams:", error);
    return [];
  }
  return (data ?? []) as LiveStream[];
}
