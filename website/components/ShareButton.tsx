"use client";

import { useEffect, useRef, useState } from "react";
import {
  buildShareIntents,
  formatShareCount,
  recordShare,
  type CaseKind,
} from "@/lib/share";
import { ShareReward } from "@/components/ShareReward";

export function ShareButton({
  url,
  title,
  slug,
  caseKind,
  compact = false,
  shares,
}: {
  url: string;
  title: string;
  slug?: string;
  caseKind?: CaseKind;
  compact?: boolean;
  /** When provided, shows a live, optimistic share count next to the button. */
  shares?: number;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [supportsNative, setSupportsNative] = useState(false);
  const [rewarded, setRewarded] = useState(false);
  // Optimistic local count so the number visibly ticks up the instant you
  // share — the durable value comes back from the DB on the next load.
  const [localShares, setLocalShares] = useState(0);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const rewardTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function fireReward() {
    setRewarded(true);
    setLocalShares((n) => n + 1);
    if (rewardTimer.current) clearTimeout(rewardTimer.current);
    rewardTimer.current = setTimeout(() => setRewarded(false), 1600);
  }

  function share(action: "share_platform" | "share_copy" | "share_native" | "share_menu_open", platform: string) {
    recordShare({ action, platform, title, slug, caseKind, compact });
    if (action !== "share_menu_open") fireReward();
  }

  useEffect(() => {
    setSupportsNative(
      typeof navigator !== "undefined" && typeof navigator.share === "function"
    );
    return () => {
      if (rewardTimer.current) clearTimeout(rewardTimer.current);
    };
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
      share("share_native", "native");
      setOpen(false);
    } catch {
      // user cancelled or share failed — keep menu open, don't count
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      share("share_copy", "copy");
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  const intents = buildShareIntents(url, title);
  const shownCount = (shares ?? 0) + localShares;

  return (
    <div ref={wrapRef} className="relative">
      <ShareReward show={rewarded} />
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) share("share_menu_open", "site");
        }}
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
        {shownCount > 0 ? (
          <span className="tabular-nums text-[var(--color-accent)] font-bold">
            {formatShareCount(shownCount)}
          </span>
        ) : null}
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
          {intents.map((p) => (
            <a
              key={p.name}
              href={p.href}
              target={p.scheme ? undefined : "_blank"}
              rel={p.scheme ? undefined : "noopener noreferrer"}
              role="menuitem"
              onClick={() => {
                share("share_platform", p.name);
                setOpen(false);
              }}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-accent)] transition"
            >
              <span className="w-4 text-center text-sm font-bold leading-none" aria-hidden>
                {p.icon}
              </span>
              {p.name === "X" ? "Post to X" : p.name === "Text" ? "Text it" : p.name}
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
