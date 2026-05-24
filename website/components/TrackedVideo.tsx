"use client";

import { useRef } from "react";
import { trackEvent } from "@/lib/analytics";

export function TrackedVideo({
  src,
  title,
}: {
  src: string;
  title?: string;
}) {
  const milestones = useRef(new Set<number>());
  const safeTitle = title ?? "Untitled";

  function props() {
    return {
      source: "direct",
      video_title: safeTitle,
    };
  }

  function onTimeUpdate(event: React.SyntheticEvent<HTMLVideoElement>) {
    const video = event.currentTarget;
    if (!video.duration || !Number.isFinite(video.duration)) return;
    const pct = Math.round((video.currentTime / video.duration) * 100);
    for (const milestone of [25, 50, 75]) {
      if (pct >= milestone && !milestones.current.has(milestone)) {
        milestones.current.add(milestone);
        trackEvent(`video_progress_${milestone}`, props());
      }
    }
  }

  return (
    <video
      src={src}
      controls
      playsInline
      preload="metadata"
      onPlay={() => trackEvent("video_play", props())}
      onPause={() => trackEvent("video_pause", props())}
      onTimeUpdate={onTimeUpdate}
      onEnded={() => trackEvent("video_complete", props())}
      onError={() => trackEvent("video_error", props())}
      className="aspect-video w-full rounded-lg bg-black"
    />
  );
}
