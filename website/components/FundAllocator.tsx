"use client";

import { useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics";

type Bucket = {
  id: string;
  label: string;
  blurb: string | null;
  goal_cents: number;
  raised_cents: number;
};

// $50 / $100 / $250 / $500 — a deliberately bigger ask than the quick-give box.
const TIERS = [5000, 10000, 25000, 50000];
const DEFAULT_CENTS = 25000;

// Inline greens so the "counter going across" is guaranteed green regardless of
// the Tailwind palette build.
const GREEN = "#16a34a";
const GREEN_BAR = "linear-gradient(90deg, #34d399, #16a34a)";
const GREEN_RING = "0 0 0 3px rgba(22,163,74,0.25)";

function money(cents: number): string {
  return "$" + Math.round(cents / 100).toLocaleString("en-US");
}

function pct(raised: number, goal: number): number {
  if (goal <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((raised / goal) * 100)));
}

function emojiFor(label: string): string {
  const l = label.toLowerCase();
  if (l.includes("rent") || l.includes("hous")) return "🏠";
  if (l.includes("grocer") || l.includes("food")) return "🛒";
  if (l.includes("tool") || l.includes("build") || l.includes("claude") || l.includes("cowork")) return "🛠️";
  if (l.includes("research") || l.includes("chatgpt") || l.includes("codex")) return "🔎";
  if (l.includes("gas") || l.includes("fuel") || l.includes("car")) return "⛽";
  if (l.includes("legal") || l.includes("case") || l.includes("court")) return "⚖️";
  if (l.includes("health") || l.includes("medic") || l.includes("therap")) return "🩺";
  return "🎯";
}

// Eased count-up that runs once `armed` flips true.
function useCountUp(target: number, armed: boolean, ms = 1200): number {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!armed) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, armed, ms]);
  return val;
}

function ProgressBar({ value, armed, height }: { value: number; armed: boolean; height: number }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    if (!armed) return;
    const id = setTimeout(() => setW(value), 120);
    return () => clearTimeout(id);
  }, [armed, value]);
  return (
    <div
      className="w-full rounded-full bg-[var(--color-line)] overflow-hidden"
      style={{ height }}
    >
      <div
        className="h-full rounded-full"
        style={{ width: `${w}%`, backgroundImage: GREEN_BAR, transition: "width 1100ms cubic-bezier(0.22,1,0.36,1)" }}
      />
    </div>
  );
}

function BucketCard({
  bucket,
  selected,
  armed,
  onSelect,
}: {
  bucket: Bucket;
  selected: boolean;
  armed: boolean;
  onSelect: () => void;
}) {
  const p = pct(bucket.raised_cents, bucket.goal_cents);
  const shown = useCountUp(bucket.raised_cents, armed);
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className="w-full text-left rounded-2xl border-2 p-4 transition-transform"
      style={{
        borderColor: selected ? GREEN : "var(--color-line)",
        background: selected ? "rgba(22,163,74,0.06)" : "var(--color-surface)",
        boxShadow: selected ? GREEN_RING : "none",
        transform: selected ? "scale(1.01)" : "none",
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-bold text-[var(--color-ink)] flex items-center gap-2">
          <span className="text-xl" aria-hidden>{emojiFor(bucket.label)}</span>
          {bucket.label}
        </span>
        <span className="text-sm font-bold tabular-nums" style={{ color: GREEN }}>{p}%</span>
      </div>
      <div className="mt-3">
        <ProgressBar value={p} armed={armed} height={12} />
      </div>
      <div className="mt-2 flex items-baseline justify-between text-sm">
        <span className="font-bold tabular-nums text-[var(--color-ink)]">
          {money(shown)} <span className="font-medium text-[var(--color-muted)]">raised</span>
        </span>
        <span className="text-[var(--color-muted)] tabular-nums">of {money(bucket.goal_cents)}/mo</span>
      </div>
    </button>
  );
}

export function FundAllocator() {
  const [buckets, setBuckets] = useState<Bucket[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [amount, setAmount] = useState<number>(DEFAULT_CENTS);
  const [custom, setCustom] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/funding/buckets")
      .then((r) => r.json())
      .then((j) => {
        if (!alive) return;
        const bs = (j.buckets ?? []) as Bucket[];
        setBuckets(bs);
        setSelected((cur) => cur ?? (bs[0]?.id ?? null));
        setTimeout(() => alive && setArmed(true), 80);
      })
      .catch(() => alive && setBuckets([]));
    return () => {
      alive = false;
    };
  }, []);

  const effectiveCents = amount === -1 ? Math.round(parseFloat(custom || "0") * 100) : amount;
  const totalGoal = (buckets ?? []).reduce((s, b) => s + b.goal_cents, 0);
  const totalRaised = (buckets ?? []).reduce((s, b) => s + b.raised_cents, 0);
  const totalShown = useCountUp(totalRaised, armed, 1300);
  const selectedBucket = (buckets ?? []).find((b) => b.id === selected) ?? null;
  const ready = buckets !== null && buckets.length > 0;

  async function give() {
    setErr(null);
    if (!selectedBucket) {
      setErr("Pick what to fund first.");
      return;
    }
    if (!(effectiveCents >= 500)) {
      setErr("Enter at least $5.");
      return;
    }
    setBusy(true);
    trackEvent("fund_allocate_click", { bucket: selectedBucket.label, amount_cents: effectiveCents });
    try {
      const res = await fetch("/api/checkout/donate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount_cents: effectiveCents,
          campaign: `fund:${selectedBucket.id}`,
          source: "fund-allocator",
        }),
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

  const tierBtn = (cents: number, label: string) => {
    const on = amount === cents;
    return (
      <button
        key={cents}
        type="button"
        onClick={() => setAmount(cents)}
        aria-pressed={on}
        className="rounded-lg border-2 px-2 py-2.5 text-sm font-bold transition-colors"
        style={{
          borderColor: on ? GREEN : "var(--color-line)",
          background: on ? GREEN : "var(--color-surface)",
          color: on ? "#fff" : "var(--color-ink)",
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="rounded-2xl border-2 border-[var(--color-ink)] bg-[var(--color-paper)] p-6 sm:p-7">
      <p className="text-xs uppercase tracking-wider font-bold" style={{ color: GREEN }}>
        Pick where your gift goes
      </p>
      <h3 className="font-display text-xl sm:text-2xl mt-1 text-[var(--color-ink)]">
        $250 from 10 people = $2,500. That changes my life — tonight.
      </h3>
      <p className="mt-2 text-sm text-[var(--color-ink-soft)] leading-relaxed">
        Choose exactly what you want to fund and watch it fill up. Every dollar is shown, live.
      </p>

      {ready ? (
        <div className="mt-4 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-3">
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-bold text-[var(--color-ink)]">This month, total</span>
            <span className="tabular-nums font-bold" style={{ color: GREEN }}>
              {money(totalShown)} <span className="text-[var(--color-muted)] font-medium">/ {money(totalGoal)}</span>
            </span>
          </div>
          <div className="mt-2">
            <ProgressBar value={pct(totalRaised, totalGoal)} armed={armed} height={10} />
          </div>
        </div>
      ) : null}

      <div className="mt-4 grid gap-3">
        {buckets === null ? (
          [0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl border-2 border-[var(--color-line)] bg-[var(--color-surface)] animate-pulse" />
          ))
        ) : buckets.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">Funding buckets aren&apos;t set up yet.</p>
        ) : (
          buckets.map((b) => (
            <BucketCard
              key={b.id}
              bucket={b}
              selected={selected === b.id}
              armed={armed}
              onSelect={() => {
                setSelected(b.id);
                trackEvent("fund_bucket_select", { bucket: b.label });
              }}
            />
          ))
        )}
      </div>

      {ready ? (
        <>
          <div className="mt-5 grid grid-cols-4 gap-2">
            {TIERS.map((c) => tierBtn(c, money(c)))}
          </div>
          <div className="mt-2 grid grid-cols-4 gap-2 items-center">
            <button
              type="button"
              onClick={() => setAmount(-1)}
              aria-pressed={amount === -1}
              className="rounded-lg border-2 px-2 py-2.5 text-sm font-bold transition-colors"
              style={{
                borderColor: amount === -1 ? GREEN : "var(--color-line)",
                background: amount === -1 ? GREEN : "var(--color-surface)",
                color: amount === -1 ? "#fff" : "var(--color-ink)",
              }}
            >
              Other
            </button>
            {amount === -1 ? (
              <div className="col-span-3 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]">$</span>
                <input
                  value={custom}
                  onChange={(e) => setCustom(e.target.value)}
                  inputMode="decimal"
                  placeholder="Amount"
                  className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] pl-7 pr-3 py-2.5 text-base focus:outline-none"
                />
              </div>
            ) : (
              <div className="col-span-3 text-sm text-[var(--color-muted)]">
                {selectedBucket ? (
                  <>
                    Funding{" "}
                    <span className="font-bold text-[var(--color-ink)]">
                      {emojiFor(selectedBucket.label)} {selectedBucket.label}
                    </span>
                  </>
                ) : (
                  "Pick a bucket above"
                )}
              </div>
            )}
          </div>

          {err ? <p className="mt-3 text-sm font-semibold text-[var(--color-accent)]">{err}</p> : null}

          <button
            type="button"
            onClick={give}
            disabled={busy}
            className="mt-4 w-full rounded-full px-6 py-4 text-base font-bold text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: GREEN }}
          >
            {busy
              ? "Opening secure checkout…"
              : selectedBucket
                ? `Give ${amount === -1 ? "" : money(effectiveCents) + " "}to ${selectedBucket.label} →`
                : "Pick what to fund →"}
          </button>
          <p className="mt-2 text-xs text-[var(--color-muted)] text-center">
            Secure checkout by Stripe. Goes straight to me — and onto the bar above.
          </p>
        </>
      ) : null}
    </div>
  );
}
