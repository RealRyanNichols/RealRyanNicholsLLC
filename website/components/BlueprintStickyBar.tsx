"use client";

import { useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics";

/**
 * Slim, dismissible sticky bar that keeps a buy CTA one tap away once the
 * visitor scrolls past the hero. Scrolls to the packages section.
 */
export function BlueprintStickyBar() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    function onScroll() {
      // Show after the hero, hide near the very bottom (footer / packages area).
      const y = window.scrollY;
      const nearBottom =
        window.innerHeight + y > document.body.scrollHeight - 900;
      setShow(y > 700 && !nearBottom);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (dismissed || !show) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-line)] bg-[var(--color-surface)]/95 text-[var(--color-cream)] shadow-[0_-10px_40px_rgba(0,0,0,0.55)] backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black text-[var(--color-cream)]">
            Build your own legal-tech case dashboard
          </p>
          <p className="truncate text-xs font-semibold text-[var(--color-ink-soft)]">
            Three ways to start, from $2,500. Guided Build recommended.
          </p>
        </div>
        <a
          href="#packages"
          onClick={() => trackEvent("blueprint_sticky_cta", {})}
          className="btn-accent inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg px-5 py-2.5 text-sm font-black"
        >
          Choose your package
        </a>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="shrink-0 rounded-md p-1 text-[var(--color-ink-soft)] transition hover:text-[var(--color-cream)]"
        >
          <span aria-hidden className="text-lg font-black">
            &#215;
          </span>
        </button>
      </div>
    </div>
  );
}
