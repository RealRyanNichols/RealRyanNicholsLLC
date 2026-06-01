"use client";

import { useEffect, useState } from "react";

// REAL-DATA momentum strip for the Fund the Truth tool. Shows this month's true
// supporter count + total and a rotating feed of recent gifts (amount band +
// where it went + how long ago). No names, no PII, and NOTHING fabricated —
// every line is a real donation row. If there's no activity yet, it renders an
// honest "be the first" state instead of inventing numbers.

type Activity = { amount_cents: number; target_label: string; created_at: string };
type Stats = { supporter_count: number; total_cents: number; last_gift_at: string | null };

const GREEN = "#16a34a";

function money(cents: number): string {
  return "$" + Math.round(cents / 100).toLocaleString("en-US");
}

// Coarse amount band so an individual gift is never singled out by exact value.
function band(cents: number): string {
  const d = cents / 100;
  if (d < 50) return "a gift";
  if (d < 100) return "$50";
  if (d < 250) return "$100+";
  if (d < 500) return "$250+";
  if (d < 1000) return "$500+";
  return "$1,000+";
}

function ago(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 90) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const dd = Math.floor(h / 24);
  return `${dd}d ago`;
}

export function FundingMomentum() {
  const [activity, setActivity] = useState<Activity[] | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch("/api/funding/activity")
        .then((r) => r.json())
        .then((j) => {
          if (!alive) return;
          setActivity((j.activity ?? []) as Activity[]);
          setStats((j.stats ?? null) as Stats);
        })
        .catch(() => {});
    load();
    // Light refresh so a new gift shows up without a page reload (real data).
    const poll = setInterval(load, 45000);
    return () => {
      alive = false;
      clearInterval(poll);
    };
  }, []);

  // Rotate through the real recent gifts.
  useEffect(() => {
    if (!activity || activity.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % activity.length), 4000);
    return () => clearInterval(t);
  }, [activity]);

  if (!stats) {
    return <div className="mt-4 h-12 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] animate-pulse" />;
  }

  const monthName = new Date().toLocaleString("en-US", { month: "long" });

  // Honest empty state — no fake "3 people just gave."
  if (stats.supporter_count === 0) {
    return (
      <div className="mt-4 rounded-xl border-2 border-dashed border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-center">
        <p className="text-sm font-semibold text-[var(--color-ink)]">
          No gifts yet this {monthName}. Be the first to put a dollar on the board.
        </p>
      </div>
    );
  }

  const cur = activity && activity.length > 0 ? activity[idx % activity.length] : null;

  return (
    <div className="mt-4 rounded-xl border-2 px-4 py-3" style={{ borderColor: GREEN }}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <span className="text-sm font-bold text-[var(--color-ink)] tabular-nums">
          {stats.supporter_count}{" "}
          {stats.supporter_count === 1 ? "supporter" : "supporters"} this {monthName}
          <span className="mx-1.5 text-[var(--color-muted)]">·</span>
          <span style={{ color: GREEN }}>{money(stats.total_cents)} in</span>
        </span>
        {cur ? (
          <span
            key={`${cur.created_at}-${idx}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-ink-soft)]"
            style={{ animation: "fadeInUp 360ms ease" }}
          >
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: GREEN }} aria-hidden />
            {band(cur.amount_cents)} → {cur.target_label}
            <span className="text-[var(--color-muted)] font-medium">· {ago(cur.created_at)}</span>
          </span>
        ) : null}
      </div>
      <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
