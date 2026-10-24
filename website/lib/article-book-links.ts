// Ryan paused purchase links in posts on 2026-10-24 pending a replacement.
// Keep this at render time so an older article import cannot restore them.
// This affects article links only, never the site navigation or checkout API.
export function isPausedArticleBookLink(href: unknown): boolean {
  if (typeof href !== "string" || !href.trim()) return false;

  try {
    // Plain-text callouts may include the sentence's closing punctuation.
    const url = new URL(href.trim().replace(/[.,;:!?)]+$/, ""), "https://realryannichols.com");
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    const path = decodeURIComponent(url.pathname).replace(/\/+$/, "");

    if (url.hostname === "realryannichols.com" || url.hostname === "www.realryannichols.com") {
      return path === "/book" || path === "/book/preorder";
    }

    return url.hostname === "buy.stripe.com" && path === "/14A6oA4PKgKB7jPcIJ8k80U";
  } catch {
    return false;
  }
}

export function withoutPausedArticleBookLink(
  value: Record<string, unknown>,
  field: "url" | "source_url",
): Record<string, unknown> {
  return isPausedArticleBookLink(value[field]) ? { ...value, [field]: undefined } : value;
}
