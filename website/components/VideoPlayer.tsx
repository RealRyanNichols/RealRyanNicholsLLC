"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import { trackEvent } from "@/lib/analytics";

const MuxPlayer = dynamic(() => import("@mux/mux-player-react"), {
  ssr: false,
  loading: () => (
    <div className="aspect-video w-full rounded-lg bg-black/90 flex items-center justify-center text-white text-sm">
      Loading player…
    </div>
  ),
});

export function VideoPlayer({
  playbackId,
  poster,
  title,
}: {
  playbackId: string;
  poster?: string;
  title?: string;
}) {
  const milestones = useRef(new Set<number>());

  function props() {
    return {
      source: "mux",
      playback_id: playbackId,
      video_title: title ?? "Untitled",
    };
  }

  function onTimeUpdate(event: Event) {
    const player = event.target as HTMLMediaElement | null;
    if (!player?.duration || !Number.isFinite(player.duration)) return;
    const pct = Math.round((player.currentTime / player.duration) * 100);
    for (const milestone of [25, 50, 75]) {
      if (pct >= milestone && !milestones.current.has(milestone)) {
        milestones.current.add(milestone);
        trackEvent(`video_progress_${milestone}`, props());
      }
    }
  }

  return (
    <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
      <MuxPlayer
        playbackId={playbackId}
        poster={poster}
        metadata={{ video_title: title ?? "Untitled" }}
        streamType="on-demand"
        accentColor="#1a1a1a"
        onPlay={() => trackEvent("video_play", props())}
        onPause={() => trackEvent("video_pause", props())}
        onTimeUpdate={onTimeUpdate}
        onEnded={() => trackEvent("video_complete", props())}
        onError={() => trackEvent("video_error", props())}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
