import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getMuxClient, isMuxConfigured, MUX_RTMP_URL } from "@/lib/mux";
import { LIVE_STREAM_COLUMNS, liveUrl } from "@/lib/live";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, error } = await requireAdmin();
  if (error) return error;

  if (!isMuxConfigured()) {
    return NextResponse.json(
      { error: "Mux is not configured. Add MUX_TOKEN_ID and MUX_TOKEN_SECRET." },
      { status: 503 }
    );
  }

  const { id } = await params;
  const { data: row } = await supabase
    .from("live_streams")
    .select(LIVE_STREAM_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (!row?.mux_live_stream_id) {
    return NextResponse.json({ error: "Live stream not found." }, { status: 404 });
  }

  const liveStream = await getMuxClient().video.liveStreams.retrieve(
    row.mux_live_stream_id
  );

  return NextResponse.json({
    credentials: {
      liveStreamId: row.id,
      rtmpUrl: MUX_RTMP_URL,
      streamKey: liveStream.stream_key,
      watchUrl: liveUrl(row.slug),
    },
  });
}
