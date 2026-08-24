"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { getFirstTouchAttribution } from "@/lib/acquisition";
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
    const attribution = getFirstTouchAttribution();
    trackEvent("book_checkout_start", {
      slug,
      source: attribution?.source ?? null,
      medium: attribution?.medium ?? null,
      campaign: attribution?.campaign ?? null,
      content: attribution?.content ?? null,
    });
    try {
      const res = await fetch("/api/checkout/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          attribution,
          sessionId: getSessionId(),
          visitorId: getVisitorId(),
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
        <p className="mt-2 text-center text-xs font-bold text-[var(--color-accent)]">
          {error}
        </p>
      ) : null}
    </>
  );
}
