"use client";

import { useEffect, useRef } from "react";

// Renders an X / Twitter post inline via X's official embed widget — the
// video plays in-place and the original poster's name + avatar show, so
// they get credit automatically. This is the legal way to surface
// someone else's footage: we link/embed, we don't re-host.
declare global {
  interface Window {
    twttr?: { widgets?: { load?: (el?: HTMLElement | null) => void } };
  }
}

const WIDGETS_SRC = "https://platform.twitter.com/widgets.js";

export function TweetEmbed({ url }: { url: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const render = () => window.twttr?.widgets?.load?.(ref.current);
    const existing = document.getElementById("twitter-wjs");
    if (existing) {
      render();
      return;
    }
    const s = document.createElement("script");
    s.id = "twitter-wjs";
    s.src = WIDGETS_SRC;
    s.async = true;
    s.onload = render;
    document.body.appendChild(s);
  }, [url]);

  return (
    <div ref={ref} className="my-6 flex justify-center">
      <blockquote
        className="twitter-tweet"
        data-theme="dark"
        data-dnt="true"
        data-conversation="none"
      >
        <a href={url}>
          Watch the video on X →
        </a>
      </blockquote>
    </div>
  );
}
