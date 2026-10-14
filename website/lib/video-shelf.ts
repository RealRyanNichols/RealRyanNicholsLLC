import type { Post } from "@/lib/types";
import { muxThumbnailUrl } from "@/lib/mux";
import { getDirectVideoUrl } from "@/lib/direct-video";

// The homepage video shelf and the /videos lead player read from here.
// Ryan's own videos are the best-performing thing on the site (October 2026
// read of posts.views_count: 12 video posts averaged ~2,600 views each, text
// posts ~300), so they get the first screen under the hero.

export type ShelfVideo = {
  id: string;
  slug: string;
  title: string;
  href: string;
  thumb: string | null;
  durationSeconds: number | null;
  publishedAt: string | null;
  views: number;
  // What the inline player needs. Exactly one of these is set.
  muxPlaybackId: string | null;
  directUrl: string | null;
};

/** A video post the visitor can actually play, or null (still processing,
 *  not a video, or no source at all). */
export function toShelfVideo(post: Post): ShelfVideo | null {
  if (post.type !== "video") return null;
  const muxReady = post.mux_status === "ready" && !!post.mux_playback_id;
  const directUrl = muxReady ? null : getDirectVideoUrl(post.media);
  if (!muxReady && !directUrl) return null;
  const muxPlaybackId = muxReady ? post.mux_playback_id : null;
  const thumb =
    post.thumbnail_url ??
    (muxPlaybackId ? muxThumbnailUrl(muxPlaybackId, { width: 1280, time: 1 }) : null);
  // Postgres numeric can arrive as a string; never trust the wire type.
  const duration = Number(post.duration_seconds);
  return {
    id: post.id,
    slug: post.slug,
    title: post.title?.trim() || "Untitled video",
    href: `/posts/${post.slug}`,
    thumb,
    durationSeconds: Number.isFinite(duration) && duration > 0 ? duration : null,
    publishedAt: post.published_at ?? null,
    views: Number(post.views_count) || 0,
    muxPlaybackId,
    directUrl,
  };
}

/**
 * The newest playable video leads (so the next upload is the first thing a
 * visitor sees); the rest follow most-watched first, so the proven ones fill
 * the rail. Input order does not matter.
 */
export function pickShelf(
  posts: Post[],
  railSize = 8,
): { featured: ShelfVideo | null; rail: ShelfVideo[] } {
  const videos = posts.map(toShelfVideo).filter((v): v is ShelfVideo => v !== null);
  if (videos.length === 0) return { featured: null, rail: [] };
  const byNewest = [...videos].sort(
    (a, b) => Date.parse(b.publishedAt ?? "") - Date.parse(a.publishedAt ?? "") || 0,
  );
  const featured = byNewest[0]!;
  const rail = videos
    .filter((v) => v.id !== featured.id)
    .sort((a, b) => b.views - a.views)
    .slice(0, Math.max(0, railSize));
  return { featured, rail };
}

/** 105.13 → "1:45", 3725 → "1:02:05". */
export function formatVideoDuration(seconds: number | null | undefined): string {
  if (!seconds || !Number.isFinite(seconds) || seconds <= 0) return "";
  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const ss = r.toString().padStart(2, "0");
  return h > 0 ? `${h}:${m.toString().padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}
