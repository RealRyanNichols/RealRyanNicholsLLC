import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { getMuxClient, isMuxConfigured, MUX_RTMP_URL } from "@/lib/mux";
import { LIVE_STREAM_COLUMNS, liveUrl, slugifyLiveTitle } from "@/lib/live";

const createSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(2000).optional().default(""),
  category: z.string().trim().max(80).optional().default("Live"),
});

export async function GET() {
  const { supabase, error } = await requireAdmin();
  if (error) return error;

  const { data, error: streamError } = await supabase
    .from("live_streams")
    .select(`${LIVE_STREAM_COLUMNS}, live_simulcast_targets(*)`)
    .order("created_at", { ascending: false })
    .limit(50);

  if (streamError) {
    return NextResponse.json(
      { error: "Could not load live streams." },
      { status: 500 }
    );
  }

  return NextResponse.json({ liveStreams: data ?? [] });
}

export async function POST(request: Request) {
  const { supabase, user, error } = await requireAdmin();
  if (error) return error;

  if (!isMuxConfigured()) {
    return NextResponse.json(
      { error: "Mux is not configured. Add MUX_TOKEN_ID and MUX_TOKEN_SECRET." },
      { status: 503 }
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = createSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const mux = getMuxClient();
  const liveStream = await mux.video.liveStreams.create({
    playback_policies: ["public"],
    new_asset_settings: {
      playback_policies: ["public"],
      meta: { title: parsed.data.title },
    },
    latency_mode: "reduced",
    reconnect_window: 60,
    meta: { title: parsed.data.title },
  });

  const playbackId =
    liveStream.playback_ids?.find((playback) => playback.policy === "public")
      ?.id ?? liveStream.playback_ids?.[0]?.id ?? null;

  const { data: row, error: insertError } = await supabase
    .from("live_streams")
    .insert({
      slug: slugifyLiveTitle(parsed.data.title),
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category || "Live",
      status: liveStream.status === "active" ? "live" : "scheduled",
      mux_live_stream_id: liveStream.id,
      mux_playback_id: playbackId,
      mux_status: liveStream.status,
      created_by: user?.id ?? null,
    })
    .select(`${LIVE_STREAM_COLUMNS}, live_simulcast_targets(*)`)
    .single();

  if (insertError || !row) {
    return NextResponse.json(
      { error: "Live stream was created in Mux but could not be saved." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    liveStream: row,
    credentials: {
      liveStreamId: row.id,
      rtmpUrl: MUX_RTMP_URL,
      streamKey: liveStream.stream_key,
      watchUrl: liveUrl(row.slug),
    },
  });
}
