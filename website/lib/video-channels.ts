export const VIDEO_CHANNELS = [
  "January 6",
  "Political analysis",
  "Local investigations",
  "Family",
  "Fishing",
  "Case builder",
  "Community",
  "Behind the scenes",
] as const;

export type VideoChannel = (typeof VIDEO_CHANNELS)[number];

export function normalizeVideoChannel(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed || "Unsorted";
}
