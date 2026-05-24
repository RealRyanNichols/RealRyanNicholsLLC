"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import { trackEvent } from "@/lib/analytics";

const MuxPlayer = dynamic(() => import("@mux/mux-player-react"), {
  ssr: false,
  loading: () => (
    <div className="aspect-video w-full rounded-lg bg-black/90 flex items-center justify-center text-white text-sm">
      Loading live player...
    </div>
  ),
});

export function LivePlayer({
  playbackId,
  title,
  streamType = "live",
}: {
  playbackId: string;
  title: string;
  streamType?: "live" | "on-demand";
}) {
  const milestones = useRef(new Set<number>());
  const eventPrefix = streamType === "live" ? "live" : "live_replay";

  function props() {
    return {
      source: "mux",
      playback_id: playbackId,
      live_title: title,
      stream_type: streamType,
    };
  }

  function onTimeUpdate(event: Event) {
    if (streamType === "live") return;
    const player = event.target as HTMLMediaElement | null;
    if (!player?.duration || !Number.isFinite(player.duration)) return;
    const pct = Math.round((player.currentTime / player.duration) * 100);
    for (const milestone of [25, 50, 75]) {
      if (pct >= milestone && !milestones.current.has(milestone)) {
        milestones.current.add(milestone);
        trackEvent(`${eventPrefix}_progress_${milestone}`, props());
      }
    }
  }

  return (
    <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
      <MuxPlayer
        playbackId={playbackId}
        metadata={{ video_title: title, video_id: playbackId }}
        streamType={streamType}
        accentColor="#b42318"
        onPlay={() => trackEvent(`${eventPrefix}_play`, props())}
        onPause={() => trackEvent(`${eventPrefix}_pause`, props())}
        onTimeUpdate={onTimeUpdate}
        onEnded={() => trackEvent(`${eventPrefix}_complete`, props())}
        onError={() => trackEvent(`${eventPrefix}_error`, props())}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
