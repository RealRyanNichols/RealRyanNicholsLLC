"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics";

const TIERS = [5000, 10000, 25000, 50000];

function dollars(cents: number): string {
  return (cents / 100).toLocaleString("en-US");
}

export function DonateBox({ donateUrl }: { donateUrl?: string }) {
  const [amountCents, setAmountCents] = useState<number>(5000);
  const [custom, setCustom] = useState("");
  const [special, setSpecial] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const effectiveCents =
    amountCents === -1 ? Math.round(parseFloat(custom || "0") * 100) : amountCents;
  const validCustom = amountCents !== -1 || effectiveCents >= 5000;

  async function donate() {
    setErr(null);
    if (!validCustom) {
      setErr("Minimum gift is $50.");
      return;
    }
    setBusy(true);
    const campaign = special ? "special" : "goal";
    trackEvent("donate_click", { amount_cents: effectiveCents, campaign });
    try {
      const res = await fetch("/api/checkout/donate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount_cents: effectiveCents, campaign, source: "support-goal" }),
      });
      if (res.status === 503) {
        // Native checkout not configured yet — fall back to the payment link.
        if (donateUrl) {
          window.location.assign(donateUrl);
          return;
        }
        setErr("Payments aren't turned on yet. Check back shortly.");
        setBusy(false);
        return;
      }
      const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !json.url) {
        setErr(json.error ?? "Could not start checkout. Try again.");
        setBusy(false);
        return;
      }
      window.location.assign(json.url);
    } catch {
      if (donateUrl) {
        window.location.assign(donateUrl);
        return;
      }
      setErr("Network error. Try again.");
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border-2 border-[var(--color-ink)] bg-[var(--color-paper)] p-6 sm:p-7">
      <p className="text-xs uppercase tracking-wider text-[var(--color-accent)] font-bold">
        Donate
      </p>
      <h3 className="font-display text-xl sm:text-2xl mt-1 text-[var(--color-ink)]">
        Your donation funds the truth.
      </h3>
      <p className="mt-2 text-sm text-[var(--color-ink-soft)] leading-relaxed">
        Every dollar goes straight to me — no organization, no middleman. Pick an amount:
      </p>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {TIERS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => {
              setAmountCents(c);
              trackEvent("donate_amount_select", { amount_cents: c });
            }}
            aria-pressed={amountCents === c}
            className={[
              "rounded-lg border-2 px-3 py-2.5 text-sm font-bold transition",
              amountCents === c
                ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white"
                : "border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-ink)] hover:border-[var(--color-accent)]",
            ].join(" ")}
          >
            ${dollars(c)}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setAmountCents(-1)}
          aria-pressed={amountCents === -1}
          className={[
            "rounded-lg border-2 px-3 py-2.5 text-sm font-bold transition",
            amountCents === -1
              ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white"
              : "border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-ink)] hover:border-[var(--color-accent)]",
          ].join(" ")}
        >
          Other
        </button>
      </div>

      {amountCents === -1 ? (
        <div className="mt-2 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]">$</span>
          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            inputMode="decimal"
            placeholder="Amount"
            className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] pl-7 pr-3 py-2.5 text-base focus:outline-none focus:border-[var(--color-accent)]"
          />
        </div>
      ) : null}

      <label className="mt-4 flex gap-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-3 text-sm text-[var(--color-ink-soft)] cursor-pointer">
        <input
          type="checkbox"
          checked={special}
          onChange={(e) => {
            setSpecial(e.target.checked);
            trackEvent("donate_special_toggle", { special: e.target.checked });
          }}
          className="mt-0.5 h-4 w-4 accent-[var(--color-accent)]"
        />
        <span>
          <span className="font-bold text-[var(--color-ink)]">Make this a private special gift.</span>{" "}
          Keep it off the public goal — it won&apos;t be counted or shown. By default your gift
          counts toward the monthly goal above.
        </span>
      </label>

      {err ? (
        <p className="mt-3 text-sm font-semibold text-[var(--color-accent)]">{err}</p>
      ) : null}

      <button
        type="button"
        onClick={donate}
        disabled={busy}
        className="btn-accent mt-4 w-full rounded-full px-6 py-4 text-base font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {busy
          ? "Opening secure checkout…"
          : special
            ? `Give ${amountCents === -1 ? "" : "$" + dollars(effectiveCents) + " "}as a private gift →`
            : `Donate ${amountCents === -1 ? "" : "$" + dollars(effectiveCents) + " "}to the goal →`}
      </button>
      <p className="mt-2 text-xs text-[var(--color-muted)] text-center">
        Secure checkout by Stripe. You choose what it&apos;s for and whether it&apos;s public.
      </p>
    </div>
  );
}
