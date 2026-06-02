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

  // No forced 16:9 box: let the player size to the video's natural aspect ratio
  // so portrait (9:16) videos fill the width on mobile instead of being
  // pillar-boxed into a tiny center strip. Capped at 85vh and centered so a
  // tall portrait video doesn't dominate on desktop; landscape videos still
  // render normally.
  return (
    <div className="w-full overflow-hidden rounded-lg bg-black flex justify-center">
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
        style={{ width: "100%", maxHeight: "85vh", display: "block" }}
      />
    </div>
  );
}
