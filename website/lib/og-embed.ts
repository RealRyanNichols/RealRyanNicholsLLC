import { SITE } from "@/lib/site";

// Satori (next/og) can only embed absolute URLs or data URIs — a relative
// src like "/uploads/ryan-dc-jail.jpg" makes ImageResponse throw, which is
// how the person share card 500'd in production. Resolve local paths against
// the canonical host instead of reading from the filesystem. A dynamic
// fs.readFile path caused Next.js to trace the entire 246 MB public directory
// into each OG function, eventually pushing deployments over Vercel's 250 MB
// function limit whenever a new social card was added.

export async function ogEmbeddableImage(
  src: string | null | undefined,
): Promise<string | null> {
  if (!src) return null;
  if (/^https?:\/\//i.test(src) || src.startsWith("data:")) return src;
  if (!src.startsWith("/")) return null;
  return `${SITE.url}${src}`;
}
