"use client";

import dynamic from "next/dynamic";

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
  return (
    <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
      <MuxPlayer
        playbackId={playbackId}
        metadata={{ video_title: title, video_id: playbackId }}
        streamType={streamType}
        accentColor="#b42318"
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
