import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { getMuxClient, isMuxConfigured } from "@/lib/mux";
import { LIVE_STREAM_COLUMNS } from "@/lib/live";

const schema = z.object({
  platform: z.string().trim().min(1).max(40),
  label: z.string().trim().min(1).max(80),
  url: z
    .string()
    .trim()
    .refine((value) => /^(rtmps?|srt):\/\//i.test(value), {
      message: "Use an RTMP, RTMPS, or SRT URL.",
    }),
  streamKey: z.string().trim().min(1).max(512),
});

export async function POST(
  request: Request,
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
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const { data: row } = await supabase
    .from("live_streams")
    .select(LIVE_STREAM_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (!row?.mux_live_stream_id) {
    return NextResponse.json({ error: "Live stream not found." }, { status: 404 });
  }

  if (row.mux_status === "active" || row.status === "live") {
    return NextResponse.json(
      { error: "Add simulcast targets before the room is live." },
      { status: 409 }
    );
  }

  let destinationHost = "";
  try {
    destinationHost = new URL(parsed.data.url).host;
  } catch {
    return NextResponse.json({ error: "Invalid destination URL." }, { status: 400 });
  }

  try {
    const target = await getMuxClient().video.liveStreams.createSimulcastTarget(
      row.mux_live_stream_id,
      {
        url: parsed.data.url,
        stream_key: parsed.data.streamKey,
        passthrough: `${parsed.data.platform}: ${parsed.data.label}`.slice(0, 255),
      }
    );

    const { data: saved, error: insertError } = await supabase
      .from("live_simulcast_targets")
      .insert({
        live_stream_id: id,
        platform: parsed.data.platform,
        label: parsed.data.label,
        mux_simulcast_target_id: target.id,
        status: target.status ?? "created",
        destination_host: destinationHost,
      })
      .select("*")
      .single();

    if (insertError || !saved) {
      return NextResponse.json(
        { error: "Simulcast target was created in Mux but could not be saved." },
        { status: 500 }
      );
    }

    return NextResponse.json({ target: saved });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Mux could not create the simulcast target.",
      },
      { status: 502 }
    );
  }
}
