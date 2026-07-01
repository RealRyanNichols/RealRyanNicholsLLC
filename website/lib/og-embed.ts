import { promises as fs } from "fs";
import path from "path";
import { SITE } from "@/lib/site";

// Satori (next/og) can only embed absolute URLs or data URIs — a relative
// src like "/uploads/ryan-dc-jail.jpg" makes ImageResponse throw, which is
// how the person share card 500'd in production. Local /public assets are
// inlined as data URIs (no network hop, works in every environment); real
// remote URLs pass through; anything else falls back to an absolute URL.
const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
};

export async function ogEmbeddableImage(
  src: string | null | undefined,
): Promise<string | null> {
  if (!src) return null;
  if (/^https?:\/\//i.test(src) || src.startsWith("data:")) return src;
  if (!src.startsWith("/")) return null;

  const clean = src.split("?")[0];
  const mime = MIME_BY_EXT[path.extname(clean).toLowerCase()];
  if (mime) {
    try {
      const buf = await fs.readFile(path.join(process.cwd(), "public", clean));
      return `data:${mime};base64,${buf.toString("base64")}`;
    } catch {
      // Not bundled in /public (e.g. a runtime upload served by a route) —
      // let the renderer fetch it over HTTP instead.
    }
  }
  return `${SITE.url}${src}`;
}
