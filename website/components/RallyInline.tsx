"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { RallyPledge } from "./RallyPledge";
import { openSituationRoom } from "@/lib/situation-room";

type Snap = {
  money_points: number;
  share_points: number;
  signup_points: number;
  goal_points: number;
};
type Milestone = { points: number; title: string; reward: string };

// Compact, light-theme rally unit for in-content placement (articles, feed).
// Live meter + one-tap pledge + a link into the full Situation Room board.
export function RallyInline({
  source = "inline",
  className = "",
}: {
  source?: string;
  className?: string;
}) {
  const [snap, setSnap] = useState<Snap | null>(null);
  const [raisedCents, setRaisedCents] = useState<number | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);

  useEffect(() => {
    let mounted = true;
    const supabase = getSupabaseBrowserClient();
    async function pull() {
      const [rally, ms, money] = await Promise.all([
        supabase.rpc("rally_snapshot"),
        supabase.from("rally_milestones").select("points,title,reward").order("sort_order"),
        fetch("/api/rally/raised").then((x) => x.json()).catch(() => null),
      ]);
      if (!mounted) return;
      if (Array.isArray(rally.data) && rally.data[0]) setSnap(rally.data[0] as Snap);
      if (Array.isArray(ms.data)) setMilestones(ms.data as Milestone[]);
      if (money && money.configured) setRaisedCents(money.raised_cents as number);
    }
    void pull();
    const id = window.setInterval(pull, 30_000);
    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, []);

  const moneyPts =
    raisedCents != null && raisedCents > 0 ? Math.floor(raisedCents / 100) : snap?.money_points ?? 0;
  const goal = snap?.goal_points ?? 5000;
  const total = moneyPts + (snap?.share_points ?? 0) + (snap?.signup_points ?? 0);
  const pct = goal > 0 ? Math.min(100, Math.round((total / goal) * 100)) : 0;
  const next = milestones.find((m) => total < m.points) ?? null;

  return (
    <aside
      className={`not-prose rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--color-accent)]">
          The Rally · join in
        </p>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[var(--color-muted)]">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          live
        </span>
      </div>
      <p className="mt-2 text-lg font-bold tracking-tight text-[var(--color-ink)]">
        We&apos;re at {pct}% — every share, signup, and pledge moves it.
      </p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-[var(--color-ink-soft)]">
        <span>
          <b className="text-[var(--color-ink)]">{total.toLocaleString()}</b> / {goal.toLocaleString()} pts
        </span>
        <span>
          {next ? (
            <>
              <b className="text-[var(--color-ink)]">{(next.points - total).toLocaleString()}</b> to unlock{" "}
              {next.title}
            </>
          ) : (
            "all milestones unlocked 🎉"
          )}
        </span>
      </div>
      <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-[var(--color-line)]">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,var(--color-accent),#f0d27a)] transition-[width] duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-4">
        <RallyPledge source={source} theme="light" />
      </div>
      <button
        type="button"
        onClick={openSituationRoom}
        className="mt-3 text-sm font-bold text-[var(--color-accent)] hover:underline"
      >
        See the live war room →
      </button>
    </aside>
  );
}
