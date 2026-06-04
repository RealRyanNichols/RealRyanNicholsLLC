"use client";

import { useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { FundingMomentum } from "@/components/FundingMomentum";

type Bucket = {
  id: string;
  label: string;
  blurb: string | null;
  goal_cents: number;
  raised_cents: number;
  cadence: "monthly" | "one_time";
  sort_order: number;
};

// Real overall money raised this month (general + designated + manual offline)
// vs the $5k monthly goal. Drives the headline meter.
type Monthly = { raised_cents: number; goal_cents: number };

// $50 floor — anything less is eaten by processing fees and isn't worth a
// donor's time or Ryan's. $250 default; $500 from 10 people hits the $5k goal.
const TIERS = [5000, 10000, 25000, 50000];
const DEFAULT_CENTS = 25000;
const GENERAL = "__general__"; // "Where it's needed most" → campaign "goal"

// Inline colors so the meter renders consistently regardless of the Tailwind build.
const GREEN = "#16a34a";
const GREEN_RING = "0 0 0 3px rgba(22,163,74,0.25)";
// Red → amber → green: the bar literally climbs "out of the red" as it fills.
const RG_BAR =
  "linear-gradient(90deg, #dc2626 0%, #f97316 28%, #eab308 52%, #22c55e 78%, #16a34a 100%)";

// Interpolate red → amber → green for text/borders that track the funding level.
function colorForPct(p: number): string {
  const red = [220, 38, 38];
  const amber = [245, 158, 11];
  const green = [22, 163, 74];
  const mix = (a: number[], b: number[], t: number) =>
    a.map((v, i) => Math.round(v + (b[i] - v) * t));
  const c = p < 50 ? mix(red, amber, p / 50) : mix(amber, green, (p - 50) / 50);
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

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
  if (l.includes("medical") || l.includes("medic") || l.includes("health")) return "🩺";
  if (l.includes("gas") || l.includes("fuel")) return "⛽";
  if (l.includes("insur")) return "🚗";
  if (l.includes("tool") || l.includes("build") || l.includes("claude") || l.includes("cowork")) return "🛠️";
  if (l.includes("research") || l.includes("chatgpt") || l.includes("codex")) return "🔎";
  if (l.includes("legal") || l.includes("attorney") || l.includes("court") || l.includes("war chest")) return "⚖️";
  return "🎯";
}

// Eased count-up that runs once `armed` flips true.
function useCountUp(target: number, armed: boolean, ms = 1300): number {
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
  // The red→green gradient is anchored to the FULL track (not the fill), so a
  // low bar reads red ("in the red") and only turns green as it nears the goal.
  const innerW = w > 0 ? 10000 / w : 100; // % of the fill that spans one full track
  return (
    <div className="w-full rounded-full bg-[var(--color-line)] overflow-hidden" style={{ height }}>
      <div
        style={{
          width: `${w}%`,
          height: "100%",
          overflow: "hidden",
          borderRadius: 9999,
          transition: "width 1100ms cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        <div style={{ width: `${innerW}%`, height: "100%", backgroundImage: RG_BAR }} />
      </div>
    </div>
  );
}

function NeedCard({
  bucket,
  selected,
  armed,
  onSelect,
  onCoverFully,
}: {
  bucket: Bucket;
  selected: boolean;
  armed: boolean;
  onSelect: () => void;
  onCoverFully: () => void;
}) {
  const p = pct(bucket.raised_cents, bucket.goal_cents);
  const shown = useCountUp(bucket.raised_cents, armed);
  const per = bucket.cadence === "monthly" ? "/mo" : "";
  const remaining = Math.max(0, bucket.goal_cents - bucket.raised_cents);
  const funded = remaining <= 0;
  return (
    <div
      className="w-full rounded-xl border-2 p-3 transition-transform"
      style={{
        borderColor: selected ? GREEN : "var(--color-line)",
        background: selected ? "rgba(22,163,74,0.06)" : "var(--color-surface)",
        boxShadow: selected ? GREEN_RING : "none",
        transform: selected ? "scale(1.01)" : "none",
      }}
    >
      <button type="button" onClick={onSelect} aria-pressed={selected} className="w-full text-left">
        <div className="flex items-center justify-between gap-2">
          <span className="font-bold text-[var(--color-ink)] flex items-center gap-2 text-sm">
            <span className="text-lg" aria-hidden>{emojiFor(bucket.label)}</span>
            {bucket.label}
          </span>
          <span className="text-xs font-bold tabular-nums" style={{ color: funded ? GREEN : colorForPct(p) }}>
            {funded ? "✓ funded" : `${p}%`}
          </span>
        </div>
        {bucket.blurb ? (
          <p className="mt-1 text-xs text-[var(--color-muted)] leading-snug">{bucket.blurb}</p>
        ) : null}
        <div className="mt-2">
          <ProgressBar value={p} armed={armed} height={9} />
        </div>
        <div className="mt-1.5 flex items-baseline justify-between text-xs">
          <span className="font-bold tabular-nums text-[var(--color-ink)]">
            {money(shown)} <span className="font-medium text-[var(--color-muted)]">raised</span>
          </span>
          <span className="text-[var(--color-muted)] tabular-nums">of {money(bucket.goal_cents)}{per}</span>
        </div>
      </button>
      {!funded && remaining >= 5000 ? (
        <button
          type="button"
          onClick={onCoverFully}
          className="mt-2 min-h-11 w-full rounded-lg border px-2 py-2 text-xs font-bold transition-colors"
          style={{ borderColor: GREEN, color: GREEN, background: "transparent" }}
        >
          I&apos;ll cover this — {money(remaining)}
        </button>
      ) : null}
    </div>
  );
}

export function FundTheTruth() {
  const [buckets, setBuckets] = useState<Bucket[] | null>(null);
  const [monthly, setMonthly] = useState<Monthly | null>(null);
  const [selected, setSelected] = useState<string>(GENERAL);
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
        setBuckets((j.buckets ?? []) as Bucket[]);
        if (j.monthly) setMonthly(j.monthly as Monthly);
        setTimeout(() => alive && setArmed(true), 80);
      })
      .catch(() => alive && setBuckets([]));
    return () => {
      alive = false;
    };
  }, []);

  // Select a bucket AND set the amount to exactly cover its remaining need,
  // then scroll to the give button — the one-tap "I'll cover this" flow.
  function coverFully(b: Bucket) {
    const remaining = Math.max(0, b.goal_cents - b.raised_cents);
    setSelected(b.id);
    setAmount(remaining);
    setCustom("");
    trackEvent("fund_cover_fully", { target: b.label, amount_cents: remaining });
    if (typeof document !== "undefined") {
      setTimeout(() => document.getElementById("fund-give-btn")?.scrollIntoView({ behavior: "smooth", block: "center" }), 60);
    }
  }

  const effectiveCents = amount === -1 ? Math.round(parseFloat(custom || "0") * 100) : amount;
  const monthlyBuckets = (buckets ?? []).filter((b) => b.cadence === "monthly");
  const legalBuckets = (buckets ?? []).filter((b) => b.cadence === "one_time");
  const monthlyGoal = monthly?.goal_cents ?? monthlyBuckets.reduce((s, b) => s + b.goal_cents, 0);
  const monthlyRaised = monthly?.raised_cents ?? 0;
  const monthlyPct = pct(monthlyRaised, monthlyGoal);
  const raisedShown = useCountUp(monthlyRaised, armed);
  const ready = buckets !== null;
  const selectedBucket = (buckets ?? []).find((b) => b.id === selected) ?? null;
  const monthName = new Date().toLocaleString("en-US", { month: "long" });

  async function give() {
    setErr(null);
    if (!(effectiveCents >= 5000)) {
      setErr("Minimum gift is $50 — anything less gets eaten up by fees.");
      return;
    }
    setBusy(true);
    // "Where it's needed most" → general "goal"; a specific need → fund:<id>.
    const campaign = selected === GENERAL ? "goal" : `fund:${selected}`;
    trackEvent("fund_give_click", {
      amount_cents: effectiveCents,
      target: selectedBucket?.label ?? "general",
    });
    try {
      const res = await fetch("/api/checkout/donate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount_cents: effectiveCents, campaign, source: "fund-the-truth" }),
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

  const tierBtn = (cents: number) => {
    const on = amount === cents;
    return (
      <button
        key={cents}
        type="button"
        onClick={() => setAmount(cents)}
        aria-pressed={on}
        className="min-h-11 rounded-lg border-2 px-2 py-2.5 text-sm font-bold transition-colors"
        style={{
          borderColor: on ? GREEN : "var(--color-line)",
          background: on ? GREEN : "var(--color-surface)",
          color: on ? "#fff" : "var(--color-ink)",
        }}
      >
        {money(cents)}
      </button>
    );
  };

  const targetLabel =
    selected === GENERAL ? "where it's needed most" : selectedBucket?.label ?? "the goal";

  return (
    <div className="rounded-2xl border-2 border-[var(--color-ink)] bg-[var(--color-paper)] p-6 sm:p-7">
      {/* Header */}
      <p className="text-xs uppercase tracking-[0.14em] font-bold" style={{ color: GREEN }}>
        Fund the Truth · one place, everything in the open
      </p>
      <h3 className="font-display text-2xl sm:text-3xl mt-1 text-[var(--color-ink)] leading-tight">
        $500 from 10 people = $5,000. That changes my life this month.
      </h3>
      <p className="mt-2 text-sm text-[var(--color-ink-soft)] leading-relaxed">
        My real monthly goal is <strong>$5,000</strong> — rent, food, medical, gas, insurance, and the
        tools that run this site. Right now I&apos;m in the red. Help me get to the green — give wherever
        it&apos;s needed most, or pick exactly what to fund and watch it fill. Every dollar shown, live.
      </p>

      {/* Headline monthly meter — climbs out of the red as it fills */}
      {ready ? (
        <div className="mt-4 rounded-xl border-2 p-4" style={{ borderColor: colorForPct(monthlyPct) }}>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl sm:text-4xl font-bold tabular-nums text-[var(--color-ink)] leading-none">
              {money(raisedShown)}
            </span>
            <span className="text-sm font-bold tabular-nums text-[var(--color-muted)]">
              of {money(monthlyGoal)} this month
            </span>
          </div>
          <div className="mt-3">
            <ProgressBar value={monthlyPct} armed={armed} height={16} />
          </div>
          <p className="mt-2 text-sm font-semibold" style={{ color: colorForPct(monthlyPct) }}>
            {monthlyPct < 25
              ? `Deep in the red — ${monthlyPct}% funded for ${monthName}. Help me climb out.`
              : monthlyPct < 75
                ? `Climbing — ${monthlyPct}% funded for ${monthName}. Keep it going.`
                : monthlyPct < 100
                  ? `Almost in the green — ${monthlyPct}% funded for ${monthName}.`
                  : `Fully funded for ${monthName} — thank you.`}
          </p>
        </div>
      ) : (
        <div className="mt-4 h-28 rounded-xl border-2 border-[var(--color-line)] bg-[var(--color-surface)] animate-pulse" />
      )}

      {/* Real-data momentum: supporters this month + recent gifts ticker */}
      {ready ? <FundingMomentum /> : null}

      {/* Step 1 — amount */}
      <p className="mt-6 text-xs uppercase tracking-wider font-bold text-[var(--color-muted)]">
        1 · Choose an amount
      </p>
      <div className="mt-2 grid grid-cols-4 gap-2">{TIERS.map((c) => tierBtn(c))}</div>
      <div className="mt-2">
        <button
          type="button"
          onClick={() => setAmount(-1)}
          aria-pressed={amount === -1}
          className="min-h-11 w-full rounded-lg border-2 px-3 py-2.5 text-sm font-bold transition-colors"
          style={{
            borderColor: amount === -1 ? GREEN : "var(--color-line)",
            background: amount === -1 ? "rgba(22,163,74,0.06)" : "var(--color-surface)",
            color: "var(--color-ink)",
          }}
        >
          Other amount
        </button>
        {amount === -1 ? (
          <div className="mt-2 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]">$</span>
            <input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              inputMode="decimal"
              placeholder="$50 minimum"
              autoFocus
              className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] pl-7 pr-3 py-2.5 text-base focus:outline-none"
            />
          </div>
        ) : null}
      </div>

      {/* Step 2 — where it goes */}
      <p className="mt-6 text-xs uppercase tracking-wider font-bold text-[var(--color-muted)]">
        2 · Where should it go?
      </p>

      {/* Default: needed most */}
      <button
        type="button"
        onClick={() => setSelected(GENERAL)}
        aria-pressed={selected === GENERAL}
        className="mt-2 w-full text-left rounded-xl border-2 p-3 transition-transform"
        style={{
          borderColor: selected === GENERAL ? GREEN : "var(--color-line)",
          background: selected === GENERAL ? "rgba(22,163,74,0.06)" : "var(--color-surface)",
          boxShadow: selected === GENERAL ? GREEN_RING : "none",
        }}
      >
        <span className="font-bold text-[var(--color-ink)] flex items-center gap-2 text-sm">
          <span className="text-lg" aria-hidden>💚</span> Wherever it&apos;s needed most
        </span>
        <p className="mt-1 text-xs text-[var(--color-muted)] leading-snug">
          I&apos;ll put it where it matters that day and show you. Counts toward the monthly goal above.
        </p>
      </button>

      {/* Monthly needs */}
      {ready && monthlyBuckets.length > 0 ? (
        <>
          <p className="mt-4 text-[11px] uppercase tracking-wider font-bold text-[var(--color-muted)]">
            Or a specific monthly need
          </p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {monthlyBuckets.map((b) => (
              <NeedCard
                key={b.id}
                bucket={b}
                selected={selected === b.id}
                armed={armed}
                onSelect={() => {
                  setSelected(b.id);
                  trackEvent("fund_target_select", { target: b.label });
                }}
                onCoverFully={() => coverFully(b)}
              />
            ))}
          </div>
        </>
      ) : null}

      {/* Legal war chest — separate one-time fund */}
      {ready && legalBuckets.length > 0 ? (
        <>
          <p className="mt-4 text-[11px] uppercase tracking-wider font-bold text-[var(--color-muted)]">
            Or the legal war chest (one-time — separate from the monthly goal)
          </p>
          <div className="mt-2 grid gap-2">
            {legalBuckets.map((b) => (
              <NeedCard
                key={b.id}
                bucket={b}
                selected={selected === b.id}
                armed={armed}
                onSelect={() => {
                  setSelected(b.id);
                  trackEvent("fund_target_select", { target: b.label });
                }}
                onCoverFully={() => coverFully(b)}
              />
            ))}
          </div>
          <p className="mt-2 text-xs text-[var(--color-muted)] leading-relaxed">
            I can represent myself pro se — but I really need a civil and criminal attorney to fight
            this properly. This fund goes straight to that fight.
          </p>
        </>
      ) : null}

      {err ? <p className="mt-4 text-sm font-semibold text-[var(--color-accent)]">{err}</p> : null}

      {/* Give */}
      <button
        id="fund-give-btn"
        type="button"
        onClick={give}
        disabled={busy || !ready}
        className="mt-5 w-full rounded-full px-6 py-4 text-base font-bold text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ backgroundColor: GREEN }}
      >
        {busy
          ? "Opening secure checkout…"
          : `Give ${amount === -1 ? "" : money(effectiveCents) + " "}to ${targetLabel} →`}
      </button>
      <p className="mt-2 text-xs text-[var(--color-muted)] text-center">
        Secure checkout by Stripe. Card, Link, Klarna, Affirm,
        Afterpay/Clearpay, and other options can appear when eligible.
      </p>
    </div>
  );
}
