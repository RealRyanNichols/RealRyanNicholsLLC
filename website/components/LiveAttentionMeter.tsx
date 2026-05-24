"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { DonateButtons } from "./DonateButtons";

type Pulse = { reading_now: number; today: number; week: number };

// The donation pitch as a live meter: show the attention Ryan is holding
// at this exact moment, then ask them to fund keeping it on. Polls the
// site-wide live count every 10s; leads with the strongest honest number
// so it never reads "0 reading now."
export function LiveAttentionMeter({
  donateUrl,
  seed,
}: {
  donateUrl?: string;
  seed?: Pulse;
}) {
  const [p, setP] = useState<Pulse>(seed ?? { reading_now: 0, today: 0, week: 0 });

  const poll = useCallback(async () => {
    try {
      const s = getSupabaseBrowserClient();
      const { data } = await s.rpc("site_live_pulse");
      if (data) setP(data as Pulse);
    } catch {
      /* never break the page */
    }
  }, []);

  useEffect(() => {
    poll();
    const t = setInterval(poll, 10_000);
    const onVis = () => {
      if (document.visibilityState === "visible") poll();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [poll]);

  const live = p.reading_now >= 3;
  const bigNumber = live ? p.reading_now : p.today;
  const bigLabel = live ? "reading right now" : "read this today";

  return (
    <section className="rounded-3xl border-2 border-[var(--color-accent)] bg-gradient-to-br from-[var(--color-accent-soft)] to-[var(--color-surface)] p-6 sm:p-8 relative overflow-hidden">
      <div
        className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full blur-3xl"
        style={{ background: "var(--color-accent-glow)" }}
        aria-hidden
      />
      <p className="relative text-[11px] uppercase tracking-[0.25em] text-[var(--color-accent)] font-bold flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
        </span>
        The attention you&apos;re funding · live
      </p>

      <div className="relative mt-3 flex items-end gap-3 flex-wrap">
        <span className="text-6xl sm:text-7xl font-bold tabular-nums tracking-tight leading-none text-[var(--color-ink)]">
          {bigNumber.toLocaleString()}
        </span>
        <span className="text-lg font-bold text-[var(--color-ink-soft)] pb-1">
          {bigLabel}
        </span>
      </div>
      <p className="relative mt-1 text-sm font-mono text-[var(--color-muted)]">
        {p.today.toLocaleString()} today · {p.week.toLocaleString()} this week
      </p>

      <p className="relative mt-4 text-base sm:text-lg text-[var(--color-ink-soft)] leading-relaxed max-w-2xl">
        This isn&apos;t charity. <strong className="text-[var(--color-ink)]">You&apos;re
        paying me to hold the spotlight — and aim it.</strong> Every dollar
        keeps it on, and lets me grab it again tomorrow: the next
        investigation, the next receipt, the next story they don&apos;t want
        seen. That number above is what your money buys.
      </p>

      {donateUrl ? (
        <div className="relative">
          <DonateButtons donateUrl={donateUrl} />
        </div>
      ) : null}
    </section>
  );
}
