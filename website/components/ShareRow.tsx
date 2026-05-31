"use client";

import { useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics";

const FALLBACK_URL = "https://www.realryannichols.com/posts/ive-never-asked-for-help-im-asking-now";
const SHARE_TEXT = "I've never asked for help before. I'm asking now.";

// Interactive "spread it" row — for people who can't give but can share, which
// helps just as much. Uses the live page URL so it works on any post.
export function ShareRow() {
  const [url, setUrl] = useState(FALLBACK_URL);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") setUrl(window.location.href.split("#")[0]);
  }, []);

  function copy() {
    navigator.clipboard
      ?.writeText(url)
      .then(() => {
        setCopied(true);
        trackEvent("share_copy", {});
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {});
  }

  const xHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(SHARE_TEXT)}&url=${encodeURIComponent(url)}`;
  const fbHref = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;

  const btn =
    "inline-flex items-center justify-center gap-1.5 rounded-full border-2 border-[var(--color-ink)] px-3 py-2.5 text-sm font-bold text-[var(--color-ink)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)] transition";

  return (
    <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 sm:p-5">
      <p className="text-sm font-bold text-[var(--color-ink)]">
        Can&apos;t give right now? Sharing this helps just as much.
      </p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <a href={xHref} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent("share_x", {})} className={btn}>
          Share on X
        </a>
        <a href={fbHref} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent("share_facebook", {})} className={btn}>
          Facebook
        </a>
        <button type="button" onClick={copy} className={btn} aria-live="polite">
          {copied ? "Copied ✓" : "Copy link"}
        </button>
      </div>
    </div>
  );
}
