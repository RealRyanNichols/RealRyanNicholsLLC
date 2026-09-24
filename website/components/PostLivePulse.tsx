"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export type Pulse = {
  reading_now: number;
  today: number;
  week: number;
  site_reading_now: number;
};

// Shared poller. Hits post_live_pulse(path) every 12s. Starts from the
// server-rendered seed so the first paint already has real numbers.
export function useLivePulse(path: string, seed?: Partial<Pulse>): Pulse {
  const [pulse, setPulse] = useState<Pulse>({
    reading_now: seed?.reading_now ?? 0,
    today: seed?.today ?? 0,
    week: seed?.week ?? 0,
    site_reading_now: seed?.site_reading_now ?? 0,
  });
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const poll = useCallback(async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.rpc("post_live_pulse", { p_path: path });
      if (data) setPulse(data as Pulse);
    } catch {
      // Never let a failed poll break the page.
    }
  }, [path]);

  useEffect(() => {
    poll();
    timer.current = setInterval(poll, 12_000);
    const onVis = () => {
      if (document.visibilityState === "visible") poll();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      if (timer.current) clearInterval(timer.current);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [poll]);

  return pulse;
}

// ─── Compact header strip ─────────────────────────────────────────────
// Sits under the byline. Leads with "N reading right now" when it's
// genuinely live (>=2), otherwise falls back to a strong cumulative
// number so it's never lonely.
export function PostLivePulse({
  path,
  totalViews,
  seed,
}: {
  path: string;
  totalViews: number;
  seed?: Partial<Pulse>;
}) {
  const pulse = useLivePulse(path, seed);
  const live = pulse.reading_now >= 2;
  const today = pulse.today;
  const steady = Math.max(totalViews, pulse.week);

  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-mono"
      aria-live="polite"
    >
      {live ? (
        <>
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-accent)] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-accent)]" />
          </span>
          <span className="text-[var(--color-ink)] font-bold tabular-nums">
            {pulse.reading_now.toLocaleString()}
          </span>
          <span className="text-[var(--color-muted)]">reading right now</span>
        </>
      ) : today >= 5 ? (
        <>
          <span className="text-[var(--color-muted)]">👁</span>
          <span className="text-[var(--color-ink)] font-bold tabular-nums">
            {today.toLocaleString()}
          </span>
          <span className="text-[var(--color-muted)]">read this today</span>
        </>
      ) : (
        <>
          <span className="text-[var(--color-muted)]">👁</span>
          <span className="text-[var(--color-ink)] font-bold tabular-nums">
            {steady.toLocaleString()}
          </span>
          <span className="text-[var(--color-muted)]">
            {steady === 1 ? "read" : "reads"}
          </span>
        </>
      )}
    </span>
  );
}
