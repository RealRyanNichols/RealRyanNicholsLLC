import Mux from "@mux/mux-node";

let _client: Mux | null = null;

export function getMuxClient(): Mux {
  if (_client) return _client;
  const tokenId = process.env.MUX_TOKEN_ID;
  const tokenSecret = process.env.MUX_TOKEN_SECRET;
  if (!tokenId || !tokenSecret) {
    throw new Error(
      "MUX_TOKEN_ID and MUX_TOKEN_SECRET must be set to use video features."
    );
  }
  _client = new Mux({ tokenId, tokenSecret });
  return _client;
}

export function isMuxConfigured(): boolean {
  return !!(process.env.MUX_TOKEN_ID && process.env.MUX_TOKEN_SECRET);
}

// Mux serves thumbnails over a separate hostname, no API call needed.
// https://docs.mux.com/guides/get-images-from-a-video
export function muxThumbnailUrl(
  playbackId: string,
  opts: { time?: number; width?: number; height?: number; fitMode?: "preserve" | "smartcrop" } = {}
): string {
  const params = new URLSearchParams();
  if (opts.time !== undefined) params.set("time", String(opts.time));
  if (opts.width !== undefined) params.set("width", String(opts.width));
  if (opts.height !== undefined) params.set("height", String(opts.height));
  if (opts.fitMode) params.set("fit_mode", opts.fitMode);
  const qs = params.toString();
  return `https://image.mux.com/${playbackId}/thumbnail.jpg${qs ? `?${qs}` : ""}`;
}

export function muxPlaybackUrl(playbackId: string): string {
  return `https://stream.mux.com/${playbackId}.m3u8`;
}
