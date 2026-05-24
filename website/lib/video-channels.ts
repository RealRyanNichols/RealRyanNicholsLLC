export const VIDEO_CHANNELS = [
  "J6",
  "Local investigations",
  "Family",
  "Fishing",
  "Political",
  "Community",
  "Case builder",
  "Behind the scenes",
] as const;

export type VideoChannel = (typeof VIDEO_CHANNELS)[number];

export function normalizeVideoChannel(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed || "Unsorted";
}
