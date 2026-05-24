import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { muxThumbnailUrl, getMuxClient } from "@/lib/mux";

// Mux webhooks update video posts asynchronously after upload + transcoding.
// We need to write to the posts table without a user session, so we use a
// service-role client. This file is the ONLY place that role is used.
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY must be set for the Mux webhook to update post rows."
    );
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function POST(request: NextRequest) {
  const secret = process.env.MUX_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "MUX_WEBHOOK_SECRET not configured." },
      { status: 503 }
    );
  }

  const rawBody = await request.text();
  const mux = getMuxClient();

  try {
    await mux.webhooks.verifySignature(rawBody, request.headers, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  const event = JSON.parse(rawBody) as {
    type: string;
    data: {
      id?: string;
      upload_id?: string;
      playback_ids?: { id: string; policy: string }[];
      duration?: number;
      status?: string;
    };
  };

  const supabase = getServiceClient();

  // We care about three event types:
  //   video.upload.asset_created   -> asset_id is now known
  //   video.asset.ready            -> playback_id + duration are known
  //   video.asset.errored          -> mark errored
  switch (event.type) {
    case "video.upload.asset_created": {
      const uploadId = event.data.upload_id ?? event.data.id;
      const assetId = event.data.id;
      if (!uploadId || !assetId) break;
      await supabase
        .from("posts")
        .update({ mux_asset_id: assetId, mux_status: "processing" })
        .eq("mux_upload_id", uploadId);
      break;
    }
    case "video.asset.ready": {
      const assetId = event.data.id;
      const playbackId = event.data.playback_ids?.[0]?.id ?? null;
      const duration = event.data.duration ?? null;
      if (!assetId || !playbackId) break;
      await supabase
        .from("posts")
        .update({
          mux_playback_id: playbackId,
          mux_status: "ready",
          duration_seconds: duration,
          thumbnail_url: muxThumbnailUrl(playbackId, { width: 1200 }),
        })
        .eq("mux_asset_id", assetId);
      break;
    }
    case "video.asset.errored": {
      const assetId = event.data.id;
      if (!assetId) break;
      await supabase
        .from("posts")
        .update({ mux_status: "errored" })
        .eq("mux_asset_id", assetId);
      break;
    }
    default:
      // Ignore other events.
      break;
  }

  return NextResponse.json({ ok: true });
}
