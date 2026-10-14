import type { MediaItem } from "@/lib/types";
import { DO_PREFIX, resolveDoSpacesKey } from "@/lib/video-source";

export const POST_VIDEO_BUCKET = "post-videos";
export const POST_VIDEO_MAX_BYTES = 50 * 1024 * 1024;

export function getDirectVideoUrl(media: MediaItem[] | null | undefined): string | null {
  const url = media?.[0]?.url ?? null;
  // A DigitalOcean Spaces key (lib/video-source.ts); everything else as stored.
  if (url?.startsWith(DO_PREFIX)) return resolveDoSpacesKey(url);
  return url;
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${Math.round(bytes / (1024 * 1024))} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}
