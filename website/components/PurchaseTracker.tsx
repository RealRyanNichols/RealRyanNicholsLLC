"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

// Fires the first-party + pixel "purchase" conversion once on the receipt page.
export function PurchaseTracker({
  amount,
  currency = "USD",
  eventId,
  kind,
}: {
  amount: number;
  currency?: string;
  eventId?: string;
  kind: string;
}) {
  useEffect(() => {
    const dedupeKey = eventId ? `rrn_purchase_${eventId}` : null;
    try {
      if (dedupeKey && window.localStorage.getItem(dedupeKey)) return;
      trackEvent("purchase", {
        amount,
        value: amount,
        currency: currency.toUpperCase(),
        event_id: eventId ?? null,
        kind,
      });
      if (dedupeKey) window.localStorage.setItem(dedupeKey, "1");
    } catch {
      trackEvent("purchase", {
        amount,
        value: amount,
        currency: currency.toUpperCase(),
        event_id: eventId ?? null,
        kind,
      });
    }
  }, [amount, currency, eventId, kind]);
  return null;
}
