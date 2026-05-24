"use client";

import { trackEvent } from "@/lib/analytics";

// Suggested-amount anchors. A single Stripe Payment Link collects the
// amount on its own secure page, so these chips open that page and pass
// the intended amount to analytics (donate_click) — anchoring lifts
// conversion, and we learn which amounts people reach for.
const AMOUNTS = [25, 50, 100, 250, 500];

export function DonateButtons({ donateUrl }: { donateUrl: string }) {
  function go(amount: string) {
    trackEvent("donate_click", { amount });
    window.open(donateUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="relative mt-5">
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {AMOUNTS.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => go(String(a))}
            className="rounded-xl border-2 border-[var(--color-accent)] bg-[var(--color-paper)] py-3 text-base font-bold text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-[var(--color-paper)] transition"
          >
            ${a}
          </button>
        ))}
        <button
          type="button"
          onClick={() => go("other")}
          className="rounded-xl border-2 border-[var(--color-line)] bg-[var(--color-paper)] py-3 text-base font-bold text-[var(--color-ink)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition"
        >
          Any
        </button>
      </div>
      <button
        type="button"
        onClick={() => go("primary")}
        className="btn-accent mt-3 w-full rounded-full px-6 py-4 text-base font-bold transition"
      >
        Donate now → straight to me
      </button>
      <p className="mt-3 text-xs text-[var(--color-muted)]">
        You confirm the amount on Stripe&apos;s secure page (card / Apple Pay /
        Google Pay). It goes directly to my account — no organization, no
        middleman, no fees skimmed by a platform.
      </p>
    </div>
  );
}
