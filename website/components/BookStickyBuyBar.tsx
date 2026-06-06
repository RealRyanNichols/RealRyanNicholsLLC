"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * A persistent buy-bar that slides up after the visitor scrolls past the hero,
 * keeping the launch-price CTA one tap away. Dismissible for the session.
 */
export function BookStickyBuyBar({
  priceLabel,
  listLabel,
  href = "/book/preorder",
  cta = "Pre-order",
}: {
  priceLabel: string;
  listLabel?: string;
  href?: string;
  cta?: string;
}) {
  const [show, setShow] = useState(false);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("rrn_book_bar_closed") === "1") {
      setClosed(true);
      return;
    }
    const onScroll = () => setShow(window.scrollY > 560);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (closed) return null;

  return (
    <div
      className={[
        "fixed inset-x-0 bottom-0 z-40 transition-transform duration-300",
        show ? "translate-y-0" : "translate-y-full",
      ].join(" ")}
      aria-hidden={!show}
    >
      <div className="mx-auto max-w-3xl px-3 pb-3">
        <div className="flex items-center gap-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-3 shadow-2xl">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black text-[var(--color-ink)]">
              Fighting Shadows — launch price
            </p>
            <p className="text-xs font-bold text-[var(--color-ink-soft)]">
              {listLabel ? (
                <span className="line-through opacity-60">{listLabel}</span>
              ) : null}{" "}
              <span className="text-[var(--color-accent)]">{priceLabel}</span>
            </p>
          </div>
          <Link
            href={href}
            className="shrink-0 rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-sm font-black text-[var(--color-paper)] transition hover:bg-[var(--color-accent-strong)]"
          >
            {cta}
          </Link>
          <button
            type="button"
            onClick={() => {
              sessionStorage.setItem("rrn_book_bar_closed", "1");
              setClosed(true);
            }}
            aria-label="Dismiss"
            className="shrink-0 px-1 text-xl leading-none text-[var(--color-muted)] hover:text-[var(--color-ink)]"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
