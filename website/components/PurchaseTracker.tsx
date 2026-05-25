"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

// Fires the first-party + pixel "purchase" conversion once on the receipt page.
export function PurchaseTracker({
  amount,
  kind,
}: {
  amount: number;
  kind: string;
}) {
  useEffect(() => {
    trackEvent("purchase", { amount, kind });
  }, [amount, kind]);
  return null;
}
