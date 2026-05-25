"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics";

// Free path for verified J6 defendants — no Stripe. The API enforces
// eligibility server-side; this just calls it and lands on the receipt.
export function J6ClaimButton({ slug }: { slug: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function go() {
    if (busy) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/order/j6-claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const j = (await res.json().catch(() => ({}))) as {
        order_id?: string;
        error?: string;
      };
      if (!res.ok) {
        setErr(j.error ?? "Could not claim.");
        setBusy(false);
        return;
      }
      trackEvent("j6_free_claim", { slug });
      window.location.href = `/checkout/success?free=1&order=${j.order_id ?? ""}`;
    } catch {
      setErr("Network error.");
      setBusy(false);
    }
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={go}
        disabled={busy}
        className="w-full rounded-full border-2 border-[var(--color-accent)] bg-[var(--color-accent-soft)] px-6 py-3 text-base font-bold text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-[var(--color-paper)] transition disabled:opacity-60"
      >
        {busy ? "Claiming…" : "Claim free — verified J6 defendant"}
      </button>
      {err ? <p className="mt-2 text-sm text-red-700">{err}</p> : null}
    </div>
  );
}
