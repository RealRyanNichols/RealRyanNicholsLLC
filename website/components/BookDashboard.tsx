"use client";

import { useEffect, useRef, useState } from "react";
import { BookWaitlist } from "./BookWaitlist";

const GOAL = 1000;

// Smoothly animate a number toward a moving target (count-up), re-running only
// when the target changes — reads the current value from a ref so the rAF loop
// is not restarted on every frame.
function useCountUp(target: number, durationMs = 900) {
  const [value, setValue] = useState(0);
  const valueRef = useRef(0);
  valueRef.current = value;
  useEffect(() => {
    const from = valueRef.current;
    if (from === target) return;
    let raf = 0;
    let start: number | null = null;
    const tick = (ts: number) => {
      if (start === null) start = ts;
      const p = Math.min(1, (ts - start) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return value;
}

export function BookDashboard() {
  const [count, setCount] = useState<number | null>(null);
  const [today, setToday] = useState(0);
  const display = useCountUp(count ?? 0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/book-waitlist", { cache: "no-store" });
        const json = (await res.json().catch(() => ({}))) as {
          count?: number;
          today?: number;
        };
        if (!cancelled && typeof json.count === "number") {
          setCount(json.count);
          setToday(json.today ?? 0);
        }
      } catch {
        // counter is best-effort; the form still works.
      }
    }
    load();
    const id = setInterval(load, 20000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const total = count ?? 0;
  const pct = Math.min(100, Math.round((total / GOAL) * 100));
  const spotsLeft = Math.max(0, GOAL - total);

  return (
    <div className="grid gap-4 lg:grid-cols-2 lg:items-stretch">
      {/* Sign-up form */}
      <div className="rounded-xl border border-white/10 bg-white/[0.06] p-5 sm:p-6">
        <p className="mb-3 text-sm font-black uppercase tracking-[0.16em] text-[#7fe3a9]">
          Reserve your spot
        </p>
        <BookWaitlist
          source="book_hero"
          tone="dark"
          onSuccess={() => {
            setCount((c) => (c ?? 0) + 1);
            setToday((t) => t + 1);
          }}
        />
      </div>

      {/* Live counter dashboard */}
      <div className="rounded-xl border border-white/10 bg-white/[0.06] p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#7fe3a9] opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#7fe3a9]" />
          </span>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#7fe3a9]">
            On the list right now
          </p>
        </div>
        <p className="mt-2 font-display text-6xl font-black leading-none tracking-tight tabular-nums text-[#fdf8ea] sm:text-7xl">
          {count === null ? "—" : display.toLocaleString()}
        </p>
        <p className="mt-1 text-sm font-semibold text-[#cfd9ea]">
          {total === 0 ? "Be the very first to join." : "readers and counting."}
        </p>

        <div className="mt-5">
          <div className="flex items-baseline justify-between text-xs font-bold text-[#cfd9ea]">
            <span>Founding readers</span>
            <span className="tabular-nums">
              {total.toLocaleString()} / {GOAL.toLocaleString()}
            </span>
          </div>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[#7fe3a9] transition-all duration-700"
              style={{ width: `${Math.max(total > 0 ? 2 : 0, pct)}%` }}
            />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <div className="rounded-md border border-white/10 bg-white/[0.05] p-3">
            <p className="font-display text-2xl font-black tabular-nums text-[#fdf8ea]">
              {today.toLocaleString()}
            </p>
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#d8c89e]">
              Joined today
            </p>
          </div>
          <div className="rounded-md border border-white/10 bg-white/[0.05] p-3">
            <p className="font-display text-2xl font-black tabular-nums text-[#fdf8ea]">
              {spotsLeft.toLocaleString()}
            </p>
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#d8c89e]">
              Founding spots left
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
