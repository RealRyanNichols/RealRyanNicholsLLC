"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// Bump the version to re-show the banner to people who dismissed an older one.
const DISMISS_KEY = "rrn-book-banner-v1";

/**
 * Site-wide announcement bar. Sits at the very top, above everything, so every
 * visitor sees the book pre-order. Dismissible (remembered per browser) and
 * hidden on admin and on the book pages themselves.
 */
export function AnnouncementBanner() {
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISS_KEY)) setDismissed(true);
    } catch {
      // ignore storage failures — the banner just stays visible
    }
  }, []);

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore
    }
  }

  if (dismissed) return null;
  if (pathname.startsWith("/admin") || pathname.startsWith("/book")) return null;

  return (
    <div className="relative bg-[var(--color-accent)] text-[var(--color-paper)]">
      <Link
        href="/book/preorder"
        className="block transition hover:bg-[var(--color-accent-strong)]"
      >
        <div className="mx-auto flex max-w-5xl items-center justify-center gap-x-2 gap-y-0.5 px-9 py-2 text-center text-xs font-bold leading-tight sm:text-sm">
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em]">
            Pre-order
          </span>
          <span>
            <span className="font-black">Fighting Shadows</span>
            <span className="hidden sm:inline">
              {" "}
              — my memoir of January 6. Read the first chapter free.
            </span>
          </span>
          <span className="whitespace-nowrap font-black underline underline-offset-2">
            Get it →
          </span>
        </div>
      </Link>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss announcement"
        className="absolute right-1.5 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-base leading-none text-[var(--color-paper)]/80 transition hover:bg-white/15 hover:text-[var(--color-paper)]"
      >
        ×
      </button>
    </div>
  );
}
