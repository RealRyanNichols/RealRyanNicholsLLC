"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// The mobile action bar. Talk is the primary door — it opens the chat
// panel in place via the ryanchat:open event (no navigation), feeding
// the same lead pipeline as everything else.
export function MobileSupportBar() {
  const pathname = usePathname();
  // Visitor funnel only — never in the back office.
  if (pathname.startsWith("/admin")) return null;
  return (
    <div
      data-mobile-support-bar
      className="rrn-mobile-support-bar fixed bottom-0 left-0 right-0 z-10 border-t border-[var(--color-line)] bg-[var(--color-paper)]/95 px-3 pt-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] shadow-[0_-10px_28px_rgba(26,20,16,0.14)] backdrop-blur-xl lg:hidden"
    >
      <nav
        aria-label="Mobile quick actions"
        className="mx-auto grid max-w-md grid-cols-5 gap-1.5"
      >
        <button
          type="button"
          data-track="mobile-bar-talk"
          onClick={() => window.dispatchEvent(new Event("ryanchat:open"))}
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[var(--color-navy)] px-1 text-center text-xs font-black text-[#fdf8ea]"
        >
          Talk
        </button>
        <Link
          href="/tell-your-story"
          data-track="mobile-bar-story"
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-1 text-center text-xs font-black text-[var(--color-ink)]"
        >
          Story
        </Link>
        <Link
          href="/submit"
          data-track="mobile-bar-submit"
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-1 text-center text-xs font-black text-[var(--color-ink)]"
        >
          Tip
        </Link>
        <Link
          href="/contact"
          data-track="mobile-bar-contact"
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-1 text-center text-xs font-black text-[var(--color-ink)]"
        >
          Private
        </Link>
        <Link
          href="/#join"
          data-track="mobile-bar-join"
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[#e1bd5b] bg-[#e1bd5b]/15 px-1 text-center text-xs font-black text-[var(--color-navy)]"
        >
          Join
        </Link>
      </nav>
    </div>
  );
}
