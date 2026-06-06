"use client";

import { useState } from "react";

/** Share/spread mechanism: X, Facebook, and copy-link with prefilled copy. */
export function BookShare({
  url,
  text,
  className = "",
}: {
  url: string;
  text: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const enc = encodeURIComponent;
  const xUrl = `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}`;
  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  };

  const btn =
    "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-xs font-black uppercase tracking-wide text-[var(--color-ink-soft)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]";

  return (
    <div className={["flex flex-wrap items-center gap-2", className].join(" ")}>
      <span className="text-xs font-black uppercase tracking-wider text-[var(--color-muted)]">
        Spread it
      </span>
      <a href={xUrl} target="_blank" rel="noopener noreferrer" className={btn}>
        Share on X
      </a>
      <a href={fbUrl} target="_blank" rel="noopener noreferrer" className={btn}>
        Facebook
      </a>
      <button type="button" onClick={copy} className={btn}>
        {copied ? "Link copied ✓" : "Copy link"}
      </button>
    </div>
  );
}
