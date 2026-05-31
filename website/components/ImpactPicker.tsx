"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics";

type Preset = { cents: number; emoji: string; label: string };

// Concrete, human presets tied to real needs — a quicker, warmer ask than a
// bare tier grid. The slider lets people land anywhere in between.
const PRESETS: Preset[] = [
  { cents: 3500, emoji: "🛒", label: "Groceries" },
  { cents: 6000, emoji: "⛽", label: "Gas" },
  { cents: 12000, emoji: "💊", label: "Meds" },
  { cents: 15000, emoji: "🧠", label: "Therapy" },
  { cents: 25000, emoji: "🏠", label: "Rent" },
];

const MIN = 500; // $5
const MAX = 100000; // $1,000
const DEFAULT_CENTS = 25000; // $250 — the "10 people" ask
const ACCENT = "var(--color-accent)";

function money(cents: number): string {
  return "$" + Math.round(cents / 100).toLocaleString("en-US");
}

// What the current amount tangibly covers — updates live as the slider moves.
function impactFor(cents: number): string {
  const d = cents / 100;
  if (d < 25) return "Helps keep the lights on for a day.";
  if (d < 50) return "A few days of groceries for my family.";
  if (d < 100) return "Gas and groceries to get through the week.";
  if (d < 150) return "Covers a medication refill or a co-pay.";
  if (d < 250) return "A therapy session I couldn't otherwise book.";
  if (d < 400) return "A real dent in this month's rent.";
  if (d < 700) return "A week of breathing room to keep building.";
  return "The kind of gift that changes a whole month.";
}

export function ImpactPicker() {
  const [cents, setCents] = useState(DEFAULT_CENTS);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const pct = Math.max(0, Math.min(100, ((cents - MIN) / (MAX - MIN)) * 100));

  async function give() {
    setErr(null);
    if (cents < MIN) {
      setErr("Minimum is $5.");
      return;
    }
    setBusy(true);
    trackEvent("impact_give_click", { amount_cents: cents });
    try {
      const res = await fetch("/api/checkout/donate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount_cents: cents, campaign: "goal", source: "impact-picker" }),
      });
      const j = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !j.url) {
        setErr(j.error ?? "Couldn't start checkout. Try again.");
        setBusy(false);
        return;
      }
      window.location.assign(j.url);
    } catch {
      setErr("Network error. Try again.");
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border-2 border-[var(--color-ink)] bg-[var(--color-paper)] p-6 sm:p-7">
      <p className="text-xs uppercase tracking-wider font-bold" style={{ color: ACCENT }}>
        See what your gift does
      </p>
      <h3 className="font-display text-xl sm:text-2xl mt-1 text-[var(--color-ink)]">
        Slide to your number. Watch what it covers.
      </h3>

      <div className="mt-5 flex items-end justify-between gap-3">
        <div className="text-5xl sm:text-6xl font-bold tracking-tight text-[var(--color-ink)] tabular-nums">
          {money(cents)}
        </div>
        <div className="text-right text-sm sm:text-base font-semibold max-w-[55%]" style={{ color: ACCENT }}>
          {impactFor(cents)}
        </div>
      </div>

      <div className="mt-3 h-3 w-full rounded-full bg-[var(--color-line)] overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: ACCENT, transition: "width 120ms linear" }}
        />
      </div>

      <input
        type="range"
        min={MIN}
        max={MAX}
        step={500}
        value={cents}
        onChange={(e) => setCents(parseInt(e.target.value, 10))}
        className="mt-3 w-full cursor-pointer"
        style={{ accentColor: ACCENT }}
        aria-label="Choose your donation amount"
      />

      <div className="mt-4 grid grid-cols-3 sm:grid-cols-5 gap-2">
        {PRESETS.map((p) => {
          const on = cents === p.cents;
          return (
            <button
              key={p.cents}
              type="button"
              onClick={() => setCents(p.cents)}
              aria-pressed={on}
              className="rounded-xl border-2 px-2 py-2.5 text-center transition-colors"
              style={{
                borderColor: on ? ACCENT : "var(--color-line)",
                background: on ? ACCENT : "var(--color-surface)",
                color: on ? "#fff" : "var(--color-ink)",
              }}
            >
              <div className="text-lg leading-none" aria-hidden>{p.emoji}</div>
              <div className="mt-1 text-xs font-bold">{money(p.cents)}</div>
              <div className="text-[10px] opacity-80">{p.label}</div>
            </button>
          );
        })}
      </div>

      {err ? <p className="mt-3 text-sm font-semibold" style={{ color: ACCENT }}>{err}</p> : null}

      <button
        type="button"
        onClick={give}
        disabled={busy}
        className="mt-4 w-full rounded-full px-6 py-4 text-base font-bold text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ backgroundColor: ACCENT }}
      >
        {busy ? "Opening secure checkout…" : `Give ${money(cents)} now →`}
      </button>
      <p className="mt-2 text-xs text-[var(--color-muted)] text-center">
        Secure one-time gift via Stripe. Goes straight to me.
      </p>
    </div>
  );
}
