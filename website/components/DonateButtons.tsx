"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics";

// $10 / $25 / $50 / $100 / $250 + a custom amount. When the native-checkout
// flag is on, each starts a Stripe Checkout Session via /api/checkout/donate;
// otherwise the chips open the existing hosted Payment Link.
const TIERS = [10, 25, 50, 100, 250];

export function DonateButtons({ donateUrl }: { donateUrl?: string }) {
  const native = process.env.NEXT_PUBLIC_STRIPE_NATIVE_CHECKOUT === "1";
  const [busy, setBusy] = useState(false);
  const [custom, setCustom] = useState("");
  const [err, setErr] = useState<string | null>(null);

  async function startNative(amountCents: number) {
    if (busy) return;
    setBusy(true);
    setErr(null);
    trackEvent("donate_click", { amount: amountCents / 100, native: true });
    try {
      const res = await fetch("/api/checkout/donate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount_cents: amountCents, campaign: "support" }),
      });
      const j = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };
      if (!res.ok || !j.url) {
        setErr(j.error ?? "Could not start checkout.");
        setBusy(false);
        return;
      }
      window.location.href = j.url;
    } catch {
      setErr("Network error.");
      setBusy(false);
    }
  }

  function openLink(amount: string) {
    trackEvent("donate_click", { amount });
    if (donateUrl) window.open(donateUrl, "_blank", "noopener,noreferrer");
  }

  function pickTier(dollars: number) {
    if (native) startNative(dollars * 100);
    else openLink(String(dollars));
  }

  function submitCustom() {
    const dollars = Math.round(Number(custom));
    if (!Number.isFinite(dollars) || dollars < 5 || dollars > 10000) {
      setErr("Enter an amount from $5 to $10,000.");
      return;
    }
    startNative(dollars * 100);
  }

  if (!native && !donateUrl) {
    return (
      <p className="mt-5 text-sm text-[var(--color-ink-soft)]">
        A direct donation link is being finalized.
      </p>
    );
  }

  return (
    <div className="relative mt-5">
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {TIERS.map((a) => (
          <button
            key={a}
            type="button"
            disabled={busy}
            onClick={() => pickTier(a)}
            className="rounded-xl border-2 border-[var(--color-accent)] bg-[var(--color-paper)] py-3 text-base font-bold text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-[var(--color-paper)] transition disabled:opacity-60"
          >
            ${a}
          </button>
        ))}
      </div>

      {native ? (
        <div className="mt-3 flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]">
              $
            </span>
            <input
              type="number"
              min={5}
              max={10000}
              inputMode="numeric"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="Other amount"
              aria-label="Custom donation amount in dollars"
              className="w-full rounded-xl border-2 border-[var(--color-line)] bg-[var(--color-paper)] pl-7 pr-3 py-3 text-base focus:outline-none focus:border-[var(--color-accent)]"
            />
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={submitCustom}
            className="btn-accent rounded-xl px-5 py-3 font-bold disabled:opacity-60"
          >
            {busy ? "…" : "Donate"}
          </button>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={() => openLink("other")}
            className="mt-2 w-full rounded-xl border-2 border-[var(--color-line)] bg-[var(--color-paper)] py-3 text-base font-bold text-[var(--color-ink)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition"
          >
            Any amount
          </button>
          <button
            type="button"
            onClick={() => openLink("primary")}
            className="btn-accent mt-3 w-full rounded-full px-6 py-4 text-base font-bold transition"
          >
            Donate now → straight to me
          </button>
        </>
      )}

      {err ? <p className="mt-3 text-sm text-red-700">{err}</p> : null}
      <p className="mt-3 text-xs text-[var(--color-muted)]">
        {native
          ? "Secure checkout via Stripe (card / Apple Pay / Google Pay). It goes directly to me — no organization, no middleman."
          : "You confirm the amount on Stripe's secure page (card / Apple Pay / Google Pay). It goes directly to my account — no organization, no middleman, no fees skimmed by a platform."}
      </p>
    </div>
  );
}
