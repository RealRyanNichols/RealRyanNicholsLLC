/** Match the origins allowed by next.config.mjs without breaking outside media. */
export function getImageSource(src: string): { src: string; unoptimized: boolean } {
  if (src.startsWith("/") && !src.startsWith("//")) {
    return { src, unoptimized: false };
  }

  try {
    const url = new URL(src);
    if (url.protocol === "https:" && !url.port && !url.username && !url.password) {
      // CMS card art often stores an absolute URL for an asset in /public.
      // A local path keeps that art on the current deployment and avoids a
      // second network fetch through the canonical-host redirect.
      if (["realryannichols.com", "www.realryannichols.com"].includes(url.hostname)) {
        return { src: `${url.pathname}${url.search}`, unoptimized: false };
      }
      if (url.hostname.endsWith(".supabase.co")) {
        return { src, unoptimized: false };
      }
    }
  } catch {
    // Leave non-URL sources to the browser, as before.
  }

  return { src, unoptimized: true };
}
