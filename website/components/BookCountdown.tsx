"use client";

import { useEffect, useState } from "react";

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return {
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
  };
}

function Cell({ v, u }: { v: number; u: string }) {
  return (
    <div className="flex min-w-[2.4rem] flex-col items-center">
      <span className="font-display text-2xl font-black tabular-nums leading-none sm:text-3xl">
        {String(v).padStart(2, "0")}
      </span>
      <span className="mt-1 text-[10px] font-black uppercase tracking-wider opacity-70">
        {u}
      </span>
    </div>
  );
}

/**
 * Live countdown to the launch-price deadline (FOMO). Renders nothing until
 * mounted (avoids hydration mismatch) and nothing once expired or if no date.
 */
export function BookCountdown({
  endsAt,
  label = "Launch price ends in",
  className = "",
}: {
  endsAt: string | null;
  label?: string;
  className?: string;
}) {
  const target = endsAt ? new Date(endsAt).getTime() : NaN;
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    if (!Number.isFinite(target)) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (!Number.isFinite(target) || now === null) return null;
  const remaining = target - now;
  if (remaining <= 0) return null;
  const { d, h, m, s } = parts(remaining);

  return (
    <div
      className={[
        "inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-1",
        className,
      ].join(" ")}
    >
      <span className="text-xs font-black uppercase tracking-wider opacity-80">
        {label}
      </span>
      <span className="flex items-center gap-2">
        <Cell v={d} u="days" />
        <span className="opacity-40">:</span>
        <Cell v={h} u="hrs" />
        <span className="opacity-40">:</span>
        <Cell v={m} u="min" />
        <span className="opacity-40">:</span>
        <Cell v={s} u="sec" />
      </span>
    </div>
  );
}
