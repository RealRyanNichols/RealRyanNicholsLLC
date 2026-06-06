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
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/15 bg-[var(--color-blue)] text-[var(--color-paper)] shadow-[0_-8px_24px_rgba(0,0,0,0.25)]">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black text-[var(--color-paper)]">
            Build your own legal-tech case dashboard
          </p>
          <p className="truncate text-xs font-semibold text-[#c6d2e8]">
            Three ways to start, from $2,500. Guided Build recommended.
          </p>
        </div>
        <a
          href="#packages"
          onClick={() => trackEvent("blueprint_sticky_cta", {})}
          className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg bg-[var(--color-accent)] px-5 py-2.5 text-sm font-black text-[var(--color-paper)] transition hover:bg-[var(--color-accent-strong)]"
        >
          Choose your package
        </a>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="shrink-0 rounded-md p-1 text-[#c6d2e8] transition hover:text-white"
        >
          <span aria-hidden className="text-lg font-black">
            &#215;
          </span>
        </button>
      </div>
    </div>
  );
}
