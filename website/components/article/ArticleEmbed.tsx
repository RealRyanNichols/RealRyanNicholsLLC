"use client";

import { useState } from "react";

// {{embed: {...}}} — third-party post, privacy first. NOTHING loads from the
// platform until the reader clicks: no scripts, no pixels, no iframes on page
// load. The placeholder is a navy card with one flat button; the raw URL is
// always visible as a fallback link so the citation survives platform
// deletion. Even after click, the embed is a sandboxed iframe, never an
// injected script.

type Platform = "x" | "facebook" | "youtube" | "rumble" | "truth";

const PLATFORM_NAMES: Record<Platform, string> = {
  x: "X post",
  facebook: "Facebook post",
  youtube: "YouTube video",
  rumble: "Rumble video",
  truth: "Truth Social post",
};

function embedUrl(platform: Platform, url: string): string | null {
  try {
    const u = new URL(url);
    if (platform === "youtube") {
      const id =
        u.hostname === "youtu.be"
          ? u.pathname.slice(1)
          : u.searchParams.get("v") ?? u.pathname.split("/").pop();
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    if (platform === "rumble") {
      // Rumble embed URLs are /embed/<id>; accept either form.
      if (u.pathname.startsWith("/embed/")) return url;
      return null; // watch-page URLs cannot be converted without an API call
    }
    if (platform === "x") {
      const id = u.pathname.match(/\/status\/(\d+)/)?.[1];
      return id
        ? `https://platform.twitter.com/embed/Tweet.html?id=${id}&theme=light&dnt=true`
        : null;
    }
    if (platform === "facebook") {
      return `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(url)}&show_text=true&width=500`;
    }
    return null; // truth: no sanctioned iframe embed; link-only
  } catch {
    return null;
  }
}

export function ArticleEmbed({ value }: { value: Record<string, unknown> }) {
  const platform = String(value.platform ?? "") as Platform;
  const url = typeof value.url === "string" ? value.url.trim() : "";
  const caption = typeof value.caption === "string" ? value.caption.trim() : "";
  const [loaded, setLoaded] = useState(false);

  if (!url || !(platform in PLATFORM_NAMES)) return null;
  const src = embedUrl(platform, url);

  return (
    <figure className="not-prose my-8 overflow-hidden rounded-lg border border-[#0b1b34]/25 bg-[#0b1b34] text-[#f4efe4]">
      <div className="flex items-center justify-between gap-3 border-b border-[#f4efe4]/10 px-4 py-2.5">
        <span className="text-[11px] font-black uppercase tracking-[0.16em] text-[#e1bd5b]">
          {PLATFORM_NAMES[platform]}
        </span>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="truncate text-xs font-semibold text-[#a9b7d0] underline underline-offset-2"
        >
          {url.replace(/^https?:\/\//, "").slice(0, 60)}
        </a>
      </div>

      {caption ? (
        <p className="px-4 pt-3 text-sm leading-relaxed text-[#cfd9ea]">{caption}</p>
      ) : null}

      {loaded && src ? (
        <div className="p-3">
          <iframe
            src={src}
            title={`${PLATFORM_NAMES[platform]} embed`}
            sandbox="allow-scripts allow-same-origin allow-popups"
            referrerPolicy="no-referrer"
            loading="lazy"
            className="h-[480px] w-full rounded-md border-0 bg-white"
          />
        </div>
      ) : (
        <div className="p-4">
          {src ? (
            <button
              type="button"
              onClick={() => setLoaded(true)}
              className="inline-flex min-h-11 items-center rounded-md bg-[#e1bd5b] px-5 text-sm font-black text-[#061020] transition hover:bg-[#f0d48a]"
            >
              Load this post
            </button>
          ) : (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center rounded-md bg-[#e1bd5b] px-5 text-sm font-black text-[#061020] transition hover:bg-[#f0d48a]"
            >
              Open on {PLATFORM_NAMES[platform].split(" ")[0]}
            </a>
          )}
          <p className="mt-2 text-[11px] text-[#a9b7d0]">
            Nothing loads from the platform until you choose to load it.
          </p>
        </div>
      )}
    </figure>
  );
}
