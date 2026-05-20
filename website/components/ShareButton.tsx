"use client";

import { useEffect, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type Platform = {
  name: string;
  href: string;
};

function buildPlatforms(url: string, title: string): Platform[] {
  const t = encodeURIComponent(title);
  const u = encodeURIComponent(url);
  const text = encodeURIComponent(`${title}\n\n${url}`);
  return [
    { name: "X", href: `https://twitter.com/intent/tweet?text=${t}&url=${u}` },
    { name: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { name: "Truth", href: `https://truthsocial.com/share?url=${u}` },
    { name: "Telegram", href: `https://t.me/share/url?url=${u}&text=${t}` },
    { name: "WhatsApp", href: `https://wa.me/?text=${text}` },
    { name: "Reddit", href: `https://www.reddit.com/submit?url=${u}&title=${t}` },
    { name: "Email", href: `mailto:?subject=${t}&body=${text}` },
  ];
}

export function ShareButton({
  url,
  title,
  slug,
  compact = false,
}: {
  url: string;
  title: string;
  slug?: string;
  compact?: boolean;
}) {
  function recordShare() {
    if (!slug) return;
    // Fire-and-forget; the click should not wait for the count update.
    const supabase = getSupabaseBrowserClient();
    void supabase.rpc("increment_post_shares", { post_slug: slug });
  }
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [supportsNative, setSupportsNative] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setSupportsNative(
      typeof navigator !== "undefined" && typeof navigator.share === "function"
    );
  }, []);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function tryNative() {
    if (typeof navigator === "undefined" || typeof navigator.share !== "function") return;
    try {
      await navigator.share({ title, text: title, url });
      recordShare();
      setOpen(false);
    } catch {
      // user cancelled or share failed — keep menu open, don't count
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      recordShare();
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  const platforms = buildPlatforms(url, title);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={
          compact
            ? "inline-flex items-center gap-1.5 rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-1 text-xs font-semibold text-[var(--color-ink-soft)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition"
            : "inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition"
        }
      >
        <ShareIcon className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
        Share
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-56 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-1.5 shadow-2xl shadow-black/60"
        >
          {supportsNative ? (
            <button
              type="button"
              onClick={tryNative}
              role="menuitem"
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-accent)] transition text-left"
            >
              <ShareIcon className="h-4 w-4" />
              Share via…
            </button>
          ) : null}
          <button
            type="button"
            onClick={copy}
            role="menuitem"
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-accent)] transition text-left"
          >
            <LinkIcon className="h-4 w-4" />
            {copied ? "Link copied ✓" : "Copy link"}
          </button>
          <div className="my-1 border-t border-[var(--color-line)]" />
          {platforms.map((p) => (
            <a
              key={p.name}
              href={p.href}
              target="_blank"
              rel="noopener noreferrer"
              role="menuitem"
              onClick={() => {
                recordShare();
                setOpen(false);
              }}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-accent)] transition"
            >
              <span className="w-4 text-center text-xs font-bold uppercase">
                {p.name[0]}
              </span>
              {p.name}
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}
