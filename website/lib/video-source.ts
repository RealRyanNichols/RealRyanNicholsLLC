// Video files can live in a DigitalOcean Spaces bucket, next to Mux and the
// Supabase `post-videos` bucket. Write them as `do:<key>`, for example
// `do:clips/2026-10-14-courthouse.mp4`, in a post's media URL or in a
// `{{video: do:clips/x.mp4|poster|caption}}` shortcode. The key resolves
// against NEXT_PUBLIC_DO_SPACES_CDN_URL, the bucket's CDN endpoint, e.g.
// https://ryan-videos.nyc3.cdn.digitaloceanspaces.com (set it in Vercel).
// Until that variable is set, `do:` sources render nothing, never a broken
// player. A full https:// Spaces URL works with no setup at all.

export const DO_PREFIX = "do:";

export function doSpacesBase(
  env: string | undefined = process.env.NEXT_PUBLIC_DO_SPACES_CDN_URL,
): string | null {
  const base = env?.trim().replace(/\/+$/, "");
  if (!base) return null;
  try {
    const url = new URL(base);
    return url.protocol === "https:" ? base : null;
  } catch {
    return null;
  }
}

/** `do:clips/a.mp4` → the CDN URL for that key, or null when the bucket is
 *  not configured or the key tries to climb out of it. */
export function resolveDoSpacesKey(src: string, base = doSpacesBase()): string | null {
  if (!src.startsWith(DO_PREFIX) || !base) return null;
  const key = src.slice(DO_PREFIX.length).trim().replace(/^\/+/, "");
  if (!key || key.split("/").some((part) => part === ".." || part === ".")) return null;
  return `${base}/${key.split("/").map(encodeURIComponent).join("/")}`;
}

/** A playable source: site-relative, https, or a resolvable `do:` key. */
export function resolveVideoSrc(src: string | null | undefined, base = doSpacesBase()): string | null {
  const value = src?.trim();
  if (!value) return null;
  if (value.startsWith(DO_PREFIX)) return resolveDoSpacesKey(value, base);
  if (value.startsWith("https://") || (value.startsWith("/") && !value.startsWith("//"))) {
    return value;
  }
  return null;
}
