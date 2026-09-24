"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { getCheckoutAttribution } from "@/lib/acquisition";
import { toLegacyAttribution } from "@/lib/attribution";
import { getSessionId, getVisitorId } from "@/lib/client-ids";

/**
 * Starts a Stripe Checkout session for a book tier and redirects to it.
 * The price is resolved server-side from the tier slug, never sent from here.
 */
export function BookBuyButton({
  slug,
  label,
  className,
}: {
  slug: string;
  label: string;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    if (busy) return;
    setBusy(true);
    setError(null);
    // First touch (persisted 90 days) + last campaign/referral touch. The
    // route falls back to the rrn_ft / rrn_lt cookies if these are missing.
    const { firstTouch, lastTouch } = getCheckoutAttribution();
    trackEvent("book_checkout_start", {
      slug,
      source: firstTouch?.source ?? null,
      medium: firstTouch?.medium ?? null,
      campaign: firstTouch?.campaign ?? null,
      content: firstTouch?.content ?? null,
      entry: firstTouch?.entry ?? null,
    });
    try {
      const res = await fetch("/api/checkout/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          // Pre-v2 field, kept so an older server build still accepts it.
          attribution: toLegacyAttribution(firstTouch),
          firstTouch,
          lastTouch,
          // Storage can fail in webviews; send null rather than "".
          sessionId: getSessionId() || null,
          visitorId: getVisitorId() || null,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };
      if (!res.ok || !json.url) {
        trackEvent("book_checkout_failed", { slug, status: res.status });
        setError(json.error ?? "Could not start checkout. Try again.");
        setBusy(false);
        return;
      }
      window.location.href = json.url;
    } catch {
      trackEvent("book_checkout_failed", { slug, reason: "network" });
      setError("Network error. Try again.");
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={go}
        disabled={busy}
        className={className}
      >
        {busy ? "Starting checkout..." : label}
      </button>
      {error ? (
        <p className="mt-2 text-center text-xs font-bold text-[var(--color-accent-ink)]">
          {error}
        </p>
      ) : null}
    </>
  );
}
