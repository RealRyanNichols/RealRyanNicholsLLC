"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { SITE } from "@/lib/site";
import { RallyPledge } from "./RallyPledge";
import { HotRightNow } from "./HotRightNow";
import { LiveAttentionMeter } from "./LiveAttentionMeter";

// The world-map radar is heavy (d3-geo + world-atlas). Load it only once the
// board is open, client-side.
const LiveVisitorRadar = dynamic(
  () => import("./LiveVisitorRadar").then((m) => ({ default: m.LiveVisitorRadar })),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-[260px] place-items-center text-xs text-[#8194b4]">
        Loading live map…
      </div>
    ),
  },
);

export type SiteTotals = {
  live_now?: number;
  countries_now?: number;
  total_views?: number;
  total_shares?: number;
  documents?: number;
  defendants?: number;
  grievances?: number;
  events?: number;
  days_since_pardon?: number;
};

type Rally = {
  money_points: number;
  share_points: number;
  signup_points: number;
  purchase_points: number;
  total_points: number;
  supporter_count: number;
  goal_points: number;
};

function CountUp({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    const from = prev.current;
    const to = value;
    if (from === to) return;
    const start = performance.now();
    const dur = 850;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
      else prev.current = to;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{display.toLocaleString()}</>;
}

function StatTile({
  value,
  label,
  prefix = "",
  accent = "#fdf8ea",
  live = false,
}: {
  value: number;
  label: string;
  prefix?: string;
  accent?: string;
  live?: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-white/10 bg-white/[0.03] p-3 sm:p-4">
      {live ? (
        <span className="absolute right-3 top-3 flex h-2 w-2" aria-hidden>
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#7fe3a9] opacity-70" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[#7fe3a9]" />
        </span>
      ) : null}
      <div
        className="font-display text-2xl font-black tabular-nums tracking-tight sm:text-3xl"
        style={{ color: accent }}
      >
        {prefix}
        <CountUp value={value} />
      </div>
      <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8194b4]">
        {label}
      </div>
    </div>
  );
}

export function SituationRoom({
  onClose,
  seed,
}: {
  onClose: () => void;
  seed?: SiteTotals | null;
}) {
  const [t, setT] = useState<SiteTotals | null>(seed ?? null);
  const [r, setR] = useState<Rally | null>(null);

  useEffect(() => {
    let mounted = true;
    const supabase = getSupabaseBrowserClient();
    async function pull() {
      const [totals, rally] = await Promise.all([
        supabase.rpc("site_totals"),
        supabase.rpc("rally_snapshot"),
      ]);
      if (!mounted) return;
      if (totals.data) setT(totals.data as SiteTotals);
      if (rally.data && Array.isArray(rally.data) && rally.data[0]) {
        setR(rally.data[0] as Rally);
      }
    }
    void pull();
    const id = window.setInterval(pull, 20_000);
    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, []);

  // Escape to close + lock body scroll while open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const goal = r?.goal_points ?? 5000;
  const total = r?.total_points ?? 0;
  const pct = goal > 0 ? Math.min(100, Math.round((total / goal) * 100)) : 0;

  function share() {
    const url = SITE.url;
    const text = "The record they can't bury — see it live.";
    if (typeof navigator !== "undefined" && navigator.share) {
      void navigator.share({ title: SITE.name, text, url }).catch(() => {});
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(url);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] overflow-y-auto bg-[#05080f]/95 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Situation Room"
      style={{
        backgroundImage:
          "radial-gradient(1200px 600px at 50% -10%, rgba(34,58,98,0.45), transparent 60%), linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
        backgroundSize: "auto, 44px 44px, 44px 44px",
      }}
    >
      <div className="mx-auto max-w-6xl px-4 py-5 sm:py-7">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5" aria-hidden>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#7fe3a9] opacity-70" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#7fe3a9] shadow-[0_0_10px_rgba(127,227,169,0.8)]" />
            </span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#e1bd5b]">
                Situation Room
              </p>
              <p className="text-sm font-bold text-[#fdf8ea]">
                Live data &amp; the record, in one place
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/5 text-lg text-[#cfd9ea] transition hover:border-[#e1bd5b]/60 hover:text-[#e1bd5b]"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Rally meter */}
        <section className="mt-5 rounded-xl border border-[#e1bd5b]/25 bg-[#e1bd5b]/[0.06] p-4 sm:p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#e1bd5b]">
                The Rally
              </p>
              <p className="mt-1 text-sm text-[#cfd9ea]">
                Every share, signup, and pledge moves this meter.
              </p>
            </div>
            <p className="font-display text-2xl font-black tabular-nums text-[#fdf8ea] sm:text-3xl">
              <CountUp value={total} />
              <span className="text-base font-bold text-[#8194b4]">
                {" "}
                / {goal.toLocaleString()} pts
              </span>
            </p>
          </div>
          <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#e1bd5b,#f0d27a)] transition-[width] duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-[#9fb0ca]">
            <span>
              <b className="text-[#fdf8ea]">${(r?.money_points ?? 0).toLocaleString()}</b> raised
            </span>
            <span>
              <b className="text-[#fdf8ea]">{(r?.share_points ?? 0).toLocaleString()}</b> from shares
            </span>
            <span>
              <b className="text-[#fdf8ea]">{(r?.signup_points ?? 0).toLocaleString()}</b> from signups
            </span>
            <span>
              <b className="text-[#fdf8ea]">{(r?.supporter_count ?? 0).toLocaleString()}</b> supporters
            </span>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <RallyPledge source="situation-room" />
            <button
              type="button"
              onClick={share}
              className="rounded-full border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-bold text-[#fdf8ea] transition hover:border-[#7fa9e3]/60 hover:text-[#7fa9e3]"
            >
              Share the mission
            </button>
          </div>
        </section>

        {/* Scoreboard */}
        <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <StatTile value={t?.live_now ?? 0} label="reading now" accent="#7fe3a9" live />
          <StatTile value={t?.countries_now ?? 0} label="countries now" accent="#7fa9e3" />
          <StatTile value={t?.total_views ?? 0} label="total views" />
          <StatTile value={t?.total_shares ?? 0} label="total shares" />
          <StatTile value={t?.documents ?? 0} label="evidence documents" accent="#e1bd5b" />
          <StatTile value={t?.defendants ?? 0} label="J6 defendants tracked" accent="#e1bd5b" />
          <StatTile value={r?.money_points ?? 0} label="raised" prefix="$" accent="#7fe3a9" />
          <StatTile value={t?.days_since_pardon ?? 0} label="days since the pardon" />
        </section>

        {/* Hot right now */}
        <section className="mt-5">
          <HotRightNow initial={[]} />
        </section>

        {/* Live map + attention */}
        <section className="mt-5 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] p-2">
            <LiveVisitorRadar initial={[]} />
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2">
            <LiveAttentionMeter donateUrl="/support?ref=situation-room" />
          </div>
        </section>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-xs text-[#8194b4]">
          <span>Live numbers refresh every few seconds. Press Esc to close.</span>
          <a
            href="/the-map-room"
            className="font-bold text-[#e1bd5b] hover:underline"
          >
            Open the full Map Room →
          </a>
        </div>
      </div>
    </div>
  );
}
