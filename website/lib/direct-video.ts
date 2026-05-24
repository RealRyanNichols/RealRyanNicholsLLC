import type { MediaItem } from "@/lib/types";

export const POST_VIDEO_BUCKET = "post-videos";
export const POST_VIDEO_MAX_BYTES = 50 * 1024 * 1024;

export function getDirectVideoUrl(media: MediaItem[] | null | undefined): string | null {
  return media?.[0]?.url ?? null;
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${Math.round(bytes / (1024 * 1024))} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}
