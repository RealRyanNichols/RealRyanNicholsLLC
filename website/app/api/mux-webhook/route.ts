import { NextResponse, type NextRequest } from "next/server";
import { muxThumbnailUrl, getMuxClient } from "@/lib/mux";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

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
      asset_id?: string;
      live_stream_id?: string;
      active_asset_id?: string;
      recent_asset_ids?: string[];
      playback_ids?: { id: string; policy: string }[];
      duration?: number;
      status?: string;
      error_severity?: string;
    };
  };

  const supabase = getSupabaseServiceClient();

  // We care about three event types:
  //   video.upload.asset_created   -> asset_id is now known
  //   video.asset.ready            -> playback_id + duration are known
  //   video.asset.errored          -> mark errored
  switch (event.type) {
    case "video.upload.asset_created": {
      const uploadId = event.data.id ?? event.data.upload_id;
      const assetId = event.data.asset_id;
      if (!uploadId || !assetId) break;
      await supabase
        .from("posts")
        .update({ mux_asset_id: assetId, mux_status: "processing" })
        .eq("mux_upload_id", uploadId);
      break;
    }
    case "video.asset.ready": {
      const assetId = event.data.id;
      const uploadId = event.data.upload_id;
      const playbackId = event.data.playback_ids?.[0]?.id ?? null;
      const duration = event.data.duration ?? null;
      if (!assetId || !playbackId) break;
      // Mark the post fully published. Previously this handler set
      // mux_status="ready" but never set status / published_at, so transcoded
      // videos stayed as drafts forever even though the upload UI promises
      // auto-publish.
      const postsUpdate = {
        mux_asset_id: assetId,
        mux_playback_id: playbackId,
        mux_status: "ready",
        duration_seconds: duration,
        thumbnail_url: muxThumbnailUrl(playbackId, { width: 1200 }),
        status: "published",
        published_at: new Date().toISOString(),
      };
      // Match on the upload id when available — it is always written at post
      // creation, so this keeps working even if video.upload.asset_created was
      // missed or arrived out of order. Fall back to asset id otherwise.
      if (uploadId) {
        await supabase
          .from("posts")
          .update(postsUpdate)
          .eq("mux_upload_id", uploadId);
      } else {
        await supabase
          .from("posts")
          .update(postsUpdate)
          .eq("mux_asset_id", assetId);
      }
      if (event.data.live_stream_id) {
        await supabase
          .from("live_streams")
          .update({
            mux_asset_id: assetId,
            mux_playback_id: playbackId,
            updated_at: new Date().toISOString(),
          })
          .eq("mux_live_stream_id", event.data.live_stream_id);
      }
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
    case "video.live_stream.active": {
      const liveStreamId = event.data.id;
      if (!liveStreamId) break;
      await supabase
        .from("live_streams")
        .update({
          status: "live",
          mux_status: event.data.status ?? "active",
          mux_asset_id: event.data.active_asset_id ?? null,
          started_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("mux_live_stream_id", liveStreamId);
      break;
    }
    case "video.live_stream.idle": {
      const liveStreamId = event.data.id;
      if (!liveStreamId) break;
      const recentAssetId = event.data.recent_asset_ids?.at(-1) ?? null;
      await supabase
        .from("live_streams")
        .update({
          status: "ended",
          mux_status: event.data.status ?? "idle",
          mux_asset_id: recentAssetId,
          ended_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("mux_live_stream_id", liveStreamId);
      break;
    }
    case "video.live_stream.disabled": {
      const liveStreamId = event.data.id;
      if (!liveStreamId) break;
      await supabase
        .from("live_streams")
        .update({
          status: "disabled",
          mux_status: "disabled",
          ended_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("mux_live_stream_id", liveStreamId);
      break;
    }
    case "video.asset.live_stream_completed": {
      const liveStreamId = event.data.live_stream_id;
      const assetId = event.data.id;
      if (!liveStreamId) break;
      await supabase
        .from("live_streams")
        .update({
          status: "ended",
          mux_asset_id: assetId ?? null,
          ended_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("mux_live_stream_id", liveStreamId);
      break;
    }
    case "video.live_stream.simulcast_target.idle":
    case "video.live_stream.simulcast_target.starting":
    case "video.live_stream.simulcast_target.broadcasting":
    case "video.live_stream.simulcast_target.errored":
    case "video.live_stream.simulcast_target.deleted": {
      const targetId = event.data.id;
      if (!targetId) break;
      await supabase
        .from("live_simulcast_targets")
        .update({
          status: event.type.split(".").at(-1) ?? "updated",
          last_error:
            event.type === "video.live_stream.simulcast_target.errored"
              ? event.data.error_severity ?? "Mux reported an error."
              : null,
          updated_at: new Date().toISOString(),
        })
        .eq("mux_simulcast_target_id", targetId);
      break;
    }
    default:
      // Ignore other events.
      break;
  }

  return NextResponse.json({ ok: true });
}
