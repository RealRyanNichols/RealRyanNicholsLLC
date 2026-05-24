import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { getMuxClient, isMuxConfigured } from "@/lib/mux";
import { LIVE_STREAM_COLUMNS } from "@/lib/live";

const updateSchema = z.object({
  title: z.string().trim().min(3).max(120).optional(),
  description: z.string().trim().max(2000).optional(),
  category: z.string().trim().max(80).nullable().optional(),
  status: z.enum(["scheduled", "live", "ended", "errored", "disabled"]).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("live_streams")
    .select(LIVE_STREAM_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ error: "Live stream not found." }, { status: 404 });
  }

  if (
    parsed.data.status === "ended" &&
    existing.mux_live_stream_id &&
    existing.status === "live" &&
    isMuxConfigured()
  ) {
    try {
      await getMuxClient().video.liveStreams.complete(existing.mux_live_stream_id);
    } catch {
      return NextResponse.json(
        { error: "Mux could not end the live stream. Stop the encoder and try again." },
        { status: 502 }
      );
    }
  }

  const updates: Record<string, string | null> = {
    updated_at: new Date().toISOString(),
  };
  if (parsed.data.title !== undefined) updates.title = parsed.data.title;
  if (parsed.data.description !== undefined) {
    updates.description = parsed.data.description;
  }
  if (parsed.data.category !== undefined) updates.category = parsed.data.category;
  if (parsed.data.status !== undefined) {
    updates.status = parsed.data.status;
    if (parsed.data.status === "ended") updates.ended_at = new Date().toISOString();
    if (parsed.data.status === "disabled") updates.ended_at = new Date().toISOString();
  }

  const { data: row, error: updateError } = await supabase
    .from("live_streams")
    .update(updates)
    .eq("id", id)
    .select(`${LIVE_STREAM_COLUMNS}, live_simulcast_targets(*)`)
    .single();

  if (updateError || !row) {
    return NextResponse.json(
      { error: "Could not update live stream." },
      { status: 500 }
    );
  }

  return NextResponse.json({ liveStream: row });
}
