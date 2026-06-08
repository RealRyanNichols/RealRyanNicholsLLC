"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { SITE } from "@/lib/site";
import { RallyPledge } from "./RallyPledge";
import { HotRightNow } from "./HotRightNow";
import { RallyReactions } from "./RallyReactions";
import { burstConfetti } from "@/lib/confetti";

// The world-map radar is heavy (d3-geo + world-atlas). Load it only on open.
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
  share_arrivals: number;
  countries_reached: number;
};

type Raised = { raised_cents: number; supporters: number; charges: number; configured: boolean };
type Leader = { rank: number; display_name: string; total_cents: number; gifts: number; recurring: boolean; tier: string };
type Recent = { at: string; kind: string; label: string };
type Milestone = { points: number; title: string; reward: string };

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

function ago(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const TIER_STYLE: Record<string, string> = {
  Founding: "bg-[#e1bd5b] text-[#0a1326]",
  Defender: "bg-[#7fa9e3] text-[#0a1326]",
  "Front-Line": "bg-[#7fe3a9] text-[#0a1326]",
  Supporter: "bg-white/15 text-[#cfd9ea]",
};

function MilestoneRoadmap({ total, milestones }: { total: number; milestones: Milestone[] }) {
  if (milestones.length === 0) return null;
  const next = milestones.find((m) => total < m.points);
  return (
    <section className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#e1bd5b]">
          Milestones — what we unlock together
        </p>
        {next ? (
          <p className="text-xs font-bold text-[#fdf8ea]">
            <span className="text-[#e1bd5b]">{(next.points - total).toLocaleString()}</span> pts to{" "}
            <span className="text-[#cfd9ea]">{next.title}</span>
          </p>
        ) : (
          <p className="text-xs font-bold text-[#7fe3a9]">All milestones unlocked 🎉</p>
        )}
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {milestones.map((m) => {
          const reached = total >= m.points;
          const isNext = next?.points === m.points;
          return (
            <div
              key={m.points}
              className={[
                "rounded-lg border p-3 transition",
                reached
                  ? "border-[#7fe3a9]/50 bg-[#7fe3a9]/[0.08]"
                  : isNext
                    ? "border-[#e1bd5b]/60 bg-[#e1bd5b]/[0.08]"
                    : "border-white/10 bg-white/[0.02]",
              ].join(" ")}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-display text-lg font-black tabular-nums text-[#fdf8ea]">
                  {m.points.toLocaleString()}
                </span>
                <span
                  className={[
                    "rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider",
                    reached ? "bg-[#7fe3a9] text-[#0a1326]" : isNext ? "bg-[#e1bd5b] text-[#0a1326]" : "bg-white/10 text-[#8194b4]",
                  ].join(" ")}
                >
                  {reached ? "Unlocked" : isNext ? "Next" : "Locked"}
                </span>
              </div>
              <p className="mt-1 text-sm font-bold text-[#fdf8ea]">{m.title}</p>
              <p className="mt-0.5 text-[11px] leading-snug text-[#9fb0ca]">{m.reward}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Leaderboard({ leaders }: { leaders: Leader[] }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#e1bd5b]">
        Top supporters
      </p>
      {leaders.length === 0 ? (
        <p className="mt-3 text-xs text-[#8194b4]">
          Be the first name on the board — pledge above.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {leaders.map((l) => (
            <li key={l.rank} className="flex items-center gap-2.5">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/5 text-[11px] font-black tabular-nums text-[#cfd9ea]">
                {l.rank}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-bold text-[#fdf8ea]">
                {l.display_name}
                {l.recurring ? (
                  <span className="ml-1.5 rounded-full bg-[#7fa9e3]/20 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#7fa9e3]">
                    Monthly
                  </span>
                ) : null}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${TIER_STYLE[l.tier] ?? TIER_STYLE.Supporter}`}
              >
                {l.tier}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ActivityFeed({ recent }: { recent: Recent[] }) {
  const icon = (k: string) => (k === "pledge" ? "💵" : k === "signup" ? "✉️" : "🔁");
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2" aria-hidden>
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#7fe3a9] opacity-70" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[#7fe3a9]" />
        </span>
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#e1bd5b]">
          Live activity
        </p>
      </div>
      {recent.length === 0 ? (
        <p className="mt-3 text-xs text-[#8194b4]">Quiet for a moment…</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {recent.slice(0, 10).map((r, i) => (
            <li key={`${r.at}-${i}`} className="flex items-center gap-2 text-xs">
              <span aria-hidden>{icon(r.kind)}</span>
              <span className="min-w-0 flex-1 truncate text-[#cfd9ea]">{r.label}</span>
              <span className="shrink-0 text-[10px] text-[#5f7197]">{ago(r.at)}</span>
            </li>
          ))}
        </ul>
      )}
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
  const [raised, setRaised] = useState<Raised | null>(null);
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [recent, setRecent] = useState<Recent[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [streak, setStreak] = useState(0);
  const [pop, setPop] = useState<number | null>(null);
  const prevTotal = useRef<number | null>(null);
  const celebrated = useRef<Set<number>>(new Set());
  const milestonesInit = useRef(false);

  useEffect(() => {
    let mounted = true;
    const supabase = getSupabaseBrowserClient();
    async function pull() {
      const [totals, rally, lb, rc, ms, money] = await Promise.all([
        supabase.rpc("site_totals"),
        supabase.rpc("rally_snapshot"),
        supabase.rpc("get_rally_leaderboard", { p_limit: 10 }),
        supabase.rpc("rally_recent", { p_limit: 16 }),
        supabase.from("rally_milestones").select("points,title,reward").order("sort_order"),
        fetch("/api/rally/raised").then((x) => x.json()).catch(() => null),
      ]);
      if (!mounted) return;
      if (totals.data) setT(totals.data as SiteTotals);
      if (Array.isArray(rally.data) && rally.data[0]) setR(rally.data[0] as Rally);
      if (Array.isArray(lb.data)) setLeaders(lb.data as Leader[]);
      if (Array.isArray(rc.data)) setRecent(rc.data as Recent[]);
      if (Array.isArray(ms.data)) setMilestones(ms.data as Milestone[]);
      if (money) setRaised(money as Raised);
    }
    void pull();
    const id = window.setInterval(pull, 20_000);
    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, []);

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

  // Daily-visit streak (local only — a personal "don't break the chain" hook).
  useEffect(() => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const raw = localStorage.getItem("rally_streak");
      let count = 1;
      if (raw) {
        const s = JSON.parse(raw) as { day: string; count: number };
        if (s.day === today) count = s.count;
        else {
          const yest = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
          count = s.day === yest ? s.count + 1 : 1;
        }
      }
      localStorage.setItem("rally_streak", JSON.stringify({ day: today, count }));
      setStreak(count);
    } catch {
      /* ignore */
    }
  }, []);

  // Money = Stripe (accurate) when available, else the DB snapshot.
  const raisedCents =
    raised?.configured && raised.raised_cents > 0
      ? raised.raised_cents
      : (r?.money_points ?? 0) * 100;
  const moneyPts = Math.floor(raisedCents / 100);
  const goal = r?.goal_points ?? 5000;
  const total = moneyPts + (r?.share_points ?? 0) + (r?.signup_points ?? 0);
  const pct = goal > 0 ? Math.min(100, Math.round((total / goal) * 100)) : 0;
  const supporters =
    raised?.configured && raised.supporters > 0 ? raised.supporters : r?.supporter_count ?? 0;
  const lastHour = recent.filter(
    (x) => Date.now() - new Date(x.at).getTime() < 3_600_000,
  ).length;
  const inRoom = Math.max(1, t?.live_now ?? 1);

  // Seed already-reached milestones once they load, so opening the board past a
  // milestone doesn't fire confetti — only live crossings during the session do.
  useEffect(() => {
    if (milestones.length && !milestonesInit.current) {
      milestonesInit.current = true;
      for (const m of milestones) if (total >= m.points) celebrated.current.add(m.points);
    }
  }, [milestones, total]);

  // Slot-machine "+N" pop + milestone confetti when the score climbs live.
  useEffect(() => {
    if (prevTotal.current === null) {
      prevTotal.current = total;
      return;
    }
    const delta = total - prevTotal.current;
    prevTotal.current = total;
    if (delta > 0) {
      setPop(delta);
      window.setTimeout(() => setPop(null), 1500);
      for (const m of milestones) {
        if (total >= m.points && !celebrated.current.has(m.points)) {
          celebrated.current.add(m.points);
          burstConfetti();
        }
      }
    }
  }, [total, milestones]);

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
        <style>{`@keyframes rallypop{0%{opacity:0;transform:translateY(8px)}25%{opacity:1}100%{opacity:0;transform:translateY(-20px)}}`}</style>
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
            {streak > 0 ? (
              <span className="hidden items-center gap-1 rounded-full border border-[#e1bd5b]/30 bg-[#e1bd5b]/10 px-2.5 py-1 text-[11px] font-black text-[#e1bd5b] sm:inline-flex">
                🔥 Day {streak}
              </span>
            ) : null}
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
            <p className="relative font-display text-2xl font-black tabular-nums text-[#fdf8ea] sm:text-3xl">
              <CountUp value={total} />
              <span className="text-base font-bold text-[#8194b4]">
                {" "}
                / {goal.toLocaleString()} pts
              </span>
              {pop ? (
                <span
                  className="pointer-events-none absolute -top-5 right-0 text-base font-black text-[#7fe3a9]"
                  style={{ animation: "rallypop 1.4s ease-out forwards" }}
                >
                  +{pop.toLocaleString()}
                </span>
              ) : null}
            </p>
          </div>
          <div
            className={`mt-3 h-3 w-full overflow-hidden rounded-full bg-white/10 transition ${pop ? "ring-2 ring-[#7fe3a9]/60" : ""}`}
          >
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#e1bd5b,#f0d27a)] transition-[width] duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-[#9fb0ca]">
            <span>
              <b className="text-[#fdf8ea]">${moneyPts.toLocaleString()}</b> raised
            </span>
            <span>
              <b className="text-[#fdf8ea]">{(r?.share_points ?? 0).toLocaleString()}</b> from shares
            </span>
            <span>
              <b className="text-[#fdf8ea]">{(r?.signup_points ?? 0).toLocaleString()}</b> from signups
            </span>
            <span>
              <b className="text-[#fdf8ea]">{supporters.toLocaleString()}</b> supporters
            </span>
          </div>
          <p className="mt-3 text-xs font-semibold text-[#9fb0ca]">
            🔥 {lastHour.toLocaleString()} action{lastHour === 1 ? "" : "s"} in the last hour
            {inRoom > 1 ? (
              <>
                {" "}
                ·{" "}
                <span className="text-[#7fe3a9]">
                  You + {(inRoom - 1).toLocaleString()} reading right now
                </span>
              </>
            ) : null}
          </p>
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
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#5f7197]">
              React
            </span>
            <RallyReactions />
          </div>
        </section>

        {/* Milestone roadmap */}
        <MilestoneRoadmap total={total} milestones={milestones} />

        {/* Scoreboard */}
        <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <StatTile value={t?.live_now ?? 0} label="reading now" accent="#7fe3a9" live />
          <StatTile value={t?.total_views ?? 0} label="total views" />
          <StatTile value={r?.share_arrivals ?? 0} label="share arrivals" accent="#7fa9e3" />
          <StatTile value={t?.documents ?? 0} label="evidence documents" accent="#e1bd5b" />
          <StatTile value={t?.defendants ?? 0} label="J6 defendants tracked" accent="#e1bd5b" />
          <StatTile value={moneyPts} label="raised (Stripe)" prefix="$" accent="#7fe3a9" />
          <StatTile value={supporters} label="supporters" />
          <StatTile value={t?.days_since_pardon ?? 0} label="days since the pardon" />
        </section>

        {/* Hot right now */}
        <section className="mt-5">
          <HotRightNow initial={[]} />
        </section>

        {/* Live map + supporters */}
        <section className="mt-5 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] p-2">
            <LiveVisitorRadar initial={[]} />
            <p className="px-2 pb-1 pt-2 text-[11px] text-[#8194b4]">
              Reached in <b className="text-[#cfd9ea]">{(r?.countries_reached ?? 0).toLocaleString()}</b>{" "}
              countries · {(t?.total_views ?? 0).toLocaleString()} total views
            </p>
          </div>
          <div className="space-y-4">
            <Leaderboard leaders={leaders} />
            <ActivityFeed recent={recent} />
          </div>
        </section>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-xs text-[#8194b4]">
          <span>Live numbers refresh every few seconds. Press Esc to close.</span>
          <a href="/the-map-room" className="font-bold text-[#e1bd5b] hover:underline">
            Open the full Map Room →
          </a>
        </div>
      </div>
    </div>
  );
}
