"use client";

import { useState } from "react";
import Image from "next/image";
import { getImageSource } from "@/lib/image-source";
import { VideoPlayer } from "@/components/VideoPlayer";
import { TrackedVideo } from "@/components/TrackedVideo";
import { trackEvent } from "@/lib/analytics";
import { formatVideoDuration, type ShelfVideo } from "@/lib/video-shelf";

// The lead video on the homepage shelf. It paints as a plain poster (no
// player script on first load, so the homepage stays light on a phone) and
// swaps in the real player, already playing, on the first tap.
export function FeaturedVideo({
  video,
  placement,
}: {
  video: ShelfVideo;
  placement: string;
}) {
  const [playing, setPlaying] = useState(false);
  const duration = formatVideoDuration(video.durationSeconds);

  if (playing) {
    return video.muxPlaybackId ? (
      <VideoPlayer
        playbackId={video.muxPlaybackId}
        poster={video.thumb ?? undefined}
        title={video.title}
        autoPlay
      />
    ) : video.directUrl ? (
      <TrackedVideo src={video.directUrl} title={video.title} autoPlay />
    ) : null;
  }

  return (
    <button
      type="button"
      onClick={() => {
        trackEvent("video_featured_start", { slug: video.slug, placement });
        setPlaying(true);
      }}
      aria-label={`Play: ${video.title}`}
      className="group relative block aspect-video w-full overflow-hidden rounded-xl border border-[var(--color-line)] bg-black text-left shadow-[0_16px_40px_rgba(0,0,0,0.35)]"
    >
      {video.thumb ? (
        <Image
          {...getImageSource(video.thumb)}
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 992px, calc(100vw - 32px)"
          className="object-cover transition duration-300 group-hover:scale-[1.02]"
        />
      ) : null}
      <span
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent"
      />
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-gold)] text-[var(--color-navy)] shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition group-hover:scale-105">
          <svg viewBox="0 0 24 24" className="ml-1 h-9 w-9" fill="currentColor" aria-hidden>
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      </span>
      {/* The title sits under the poster as a link to the post (the shelf
          and /videos render it), so the poster only carries the length. */}
      <span className="absolute bottom-0 left-0 p-4 text-xs font-bold uppercase tracking-wider text-[var(--color-cream)] sm:p-5">
        {duration ? `Watch · ${duration}` : "Watch"}
      </span>
    </button>
  );
}
