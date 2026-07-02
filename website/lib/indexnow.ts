import { SITE } from "@/lib/site";

// IndexNow key — served at /<key>.txt (the route folder is named after it).
// Engines verify ownership by fetching that file, so the key itself is not a
// secret; rotating it means renaming the route folder to match.
export const INDEXNOW_KEY = "a7c3e9f24b8d4e619f0c5a2b7d813c46";

// Fire-and-forget ping to the IndexNow aggregator (Bing, Seznam, Naver,
// Yandex share the feed). Never throws; never blocks a publish.
export async function pingIndexNow(urls: string[]): Promise<void> {
  try {
    const host = new URL(SITE.url).host;
    const urlList = urls
      .map((u) => (u.startsWith("http") ? u : `${SITE.url}${u}`))
      .filter((u) => {
        try {
          return new URL(u).host === host;
        } catch {
          return false;
        }
      })
      .slice(0, 100);
    if (urlList.length === 0) return;
    await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host,
        key: INDEXNOW_KEY,
        keyLocation: `${SITE.url}/${INDEXNOW_KEY}.txt`,
        urlList,
      }),
    });
  } catch {
    // best-effort by design — indexing pings never break publishing
  }
}
