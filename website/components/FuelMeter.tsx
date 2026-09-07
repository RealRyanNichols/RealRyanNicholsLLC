"use client";

import { useEffect, useRef, useState } from "react";
import type { FuelStatus } from "@/lib/fuel-server";
import { daysLeftInMonth, monthName, usdWhole } from "@/lib/fuel";

// The live tank. Server-rendered with a real snapshot, then re-read every
// 20 seconds from /api/fuel/status. Money that lands while someone is on the
// page counts up in front of them.
const POLL_MS = 20_000;

export function FuelMeter({ initial }: { initial: FuelStatus }) {
  const [status, setStatus] = useState<FuelStatus>(initial);
  const [shown, setShown] = useState(initial.raised?.monthCents ?? 0);
  const [flash, setFlash] = useState(false);
  const prevRef = useRef(initial.raised?.monthCents ?? 0);
  const [, setTick] = useState(0);

  // Poll.
  useEffect(() => {
    let alive = true;
    async function read() {
      try {
        const res = await fetch("/api/fuel/status", { cache: "no-store" });
        if (!res.ok) return;
        const next = (await res.json()) as FuelStatus;
        if (alive) setStatus(next);
      } catch {
        /* keep the last good snapshot */
      }
    }
    const id = window.setInterval(read, POLL_MS);
    const tick = window.setInterval(() => setTick((t) => t + 1), 30_000);
    return () => {
      alive = false;
      window.clearInterval(id);
      window.clearInterval(tick);
    };
  }, []);

  // Count up when the month total moves.
  useEffect(() => {
    const target = status.raised?.monthCents ?? 0;
    const from = prevRef.current;
    if (target === from) return;
    prevRef.current = target;
    if (target > from) {
      setFlash(true);
      window.setTimeout(() => setFlash(false), 1800);
    }
    const start = performance.now();
    const ms = 900;
    let raf = 0;
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / ms);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(from + (target - from) * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [status.raised?.monthCents]);

  const bill = status.billCents;
  const raised = status.raised;
  const pct = raised && bill > 0 ? Math.min(100, Math.round((shown / bill) * 100)) : 0;
  const now = new Date();
  const daysLeft = daysLeftInMonth(now);
  const month = monthName(now);
  const last = raised?.lastGiftAt ? ago(raised.lastGiftAt) : null;

  return (
    <div
      className={`rounded-2xl border bg-white/[0.05] p-5 transition-shadow sm:p-6 ${
        flash ? "border-[var(--color-gold-bright)] shadow-[0_0_0_4px_rgba(225,189,91,0.25)]" : "border-[var(--color-gold-bright)]/40"
      }`}
      data-fuel-meter
      aria-live="polite"
    >
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div>
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-[var(--color-gold-bright)]">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-live)] opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--color-live)]" />
            </span>
            {month}&apos;s tank · live
          </p>
          <p className="mt-1 font-display text-4xl font-black tabular-nums tracking-tight text-[#fdf8ea] sm:text-5xl" data-fuel-month>
            {usdWhole(shown)}
            {bill > 0 ? <span className="text-xl font-bold text-[#cfd9ea] sm:text-2xl"> of {usdWhole(bill)}</span> : null}
          </p>
        </div>
        <div className="text-left sm:text-right">
          {raised ? (
            <p className="text-sm font-bold text-[#fdf8ea]">
              {raised.monthCount === 0
                ? "Nobody yet this month. The first name goes on the wall."
                : `${raised.monthCount} ${raised.monthCount === 1 ? "person has" : "people have"} fueled it this month`}
              {raised.keepers > 0 ? ` · ${raised.keepers} ${raised.keepers === 1 ? "Keeper" : "Keepers"}` : ""}
            </p>
          ) : null}
          <p className="text-sm text-[#cfd9ea]">
            {daysLeft === 0 ? "Last day of the month." : `${daysLeft} ${daysLeft === 1 ? "day" : "days"} left in ${month}.`}
            {status.liveNow > 0 ? ` ${status.liveNow} reading right now.` : ""}
          </p>
        </div>
      </div>
      <div className="mt-4 h-4 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-[var(--color-gold-bright)] transition-[width] duration-700"
          style={{ width: `${pct}%` }}
          aria-hidden
        />
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-[#a9b7d0]">
        <span>
          {raised ? `${pct}% of the month is covered.` : "The meter reads the money as it lands."}
          {raised && raised.allTimeCents > 0 ? ` ${usdWhole(raised.allTimeCents)} fueled all time.` : ""}
        </span>
        {last ? <span>Last fuel landed {last}.</span> : null}
      </div>
      {status.recent.length > 0 ? (
        <ul className="mt-4 flex flex-wrap gap-2" aria-label="Recent fuel">
          {status.recent.map((r, i) => (
            <li
              key={`${r.name}-${r.at}-${i}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs text-[#fdf8ea]"
            >
              <span className="font-bold">{r.name}</span>
              <span className="text-[#cfd9ea]">{r.tier.toLowerCase()}</span>
              {r.amount ? <span className="font-mono text-[var(--color-gold-bright)]">${r.amount}</span> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function ago(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.max(1, Math.round(ms / 60_000));
  if (min < 60) return `${min} min ago`;
  const h = Math.round(min / 60);
  if (h < 48) return `${h} ${h === 1 ? "hour" : "hours"} ago`;
  const d = Math.round(h / 24);
  return `${d} days ago`;
}
