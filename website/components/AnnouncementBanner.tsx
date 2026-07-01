"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BOOK_TIERS, formatUsd, tierSale } from "@/lib/book";

// Bump the version to re-show the banner to people who dismissed an older one.
// v2: re-show with the $17.76 launch-sale message.
const DISMISS_KEY = "rrn-book-banner-v2";

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

  const digital = BOOK_TIERS.find((t) => t.slug === "early_release_digital");
  const priceLabel = digital ? formatUsd(digital.priceUsd) : "$17.76";
  const listLabel = digital?.listPriceUsd ? formatUsd(digital.listPriceUsd) : null;
  const percentOff = digital ? tierSale(digital).percentOff : 0;

  if (dismissed) return null;
  if (pathname.startsWith("/admin") || pathname.startsWith("/book")) return null;

  return (
    <div className="relative bg-[var(--color-accent)] text-[var(--color-paper)]">
      <Link
        href="/book/preorder"
        className="block transition hover:bg-[var(--color-accent-strong)]"
      >
        <div className="mx-auto flex max-w-5xl items-center justify-center gap-x-2 gap-y-0.5 px-9 py-1.5 text-center text-xs font-bold leading-tight">
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em]">
            {percentOff > 0 ? `${percentOff}% off` : "Pre-order"}
          </span>
          <span>
            <span className="font-black">Fighting Shadows</span>
            <span className="hidden sm:inline">
              {" "}
              — my memoir of January 6. Launch price{" "}
              {listLabel ? (
                <span className="line-through opacity-75">{listLabel}</span>
              ) : null}{" "}
              <span className="font-black">{priceLabel}</span>.
            </span>
            <span className="sm:hidden"> — {priceLabel} launch price.</span>
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
