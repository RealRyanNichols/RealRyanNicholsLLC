"use client";

import dynamic from "next/dynamic";

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
  return (
    <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
      <MuxPlayer
        playbackId={playbackId}
        poster={poster}
        metadata={{ video_title: title ?? "Untitled" }}
        streamType="on-demand"
        accentColor="#1a1a1a"
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
