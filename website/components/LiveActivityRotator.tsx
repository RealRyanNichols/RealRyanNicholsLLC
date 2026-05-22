"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNowStrict } from "date-fns";

export type LiveActivityItem = {
  when: string;
  icon: string;
  text: string;
  href?: string;
};

const ROTATE_MS = 3500;

// Cycles through the activities one at a time so the strip stays
// readable when 500 people join. Crossfades between items so the eye
// doesn't snap. Pauses on hover so a visitor can read / click.
export function LiveActivityRotator({ items }: { items: LiveActivityItem[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (items.length <= 1 || paused) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % items.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [items.length, paused]);

  if (items.length === 0) return null;
  const current = items[index];

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2.5 overflow-hidden"
      aria-live="polite"
      aria-label="Live site activity"
    >
      <div className="flex items-center gap-3">
        <span className="flex-shrink-0 flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-[var(--color-success)]">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-success)] animate-pulse" />
          LIVE
        </span>
        <div
          key={current.when + current.text}
          className="flex-1 min-w-0 flex items-center gap-2 text-xs animate-[liveTickerFade_400ms_ease-out]"
        >
          <span className="flex-shrink-0">{current.icon}</span>
          {current.href ? (
            <a
              href={current.href}
              className="font-bold text-[var(--color-ink)] hover:text-[var(--color-accent)] truncate"
            >
              {current.text}
            </a>
          ) : (
            <span className="font-bold text-[var(--color-ink)] truncate">
              {current.text}
            </span>
          )}
          <span className="text-[var(--color-muted)] whitespace-nowrap">
            · {formatDistanceToNowStrict(new Date(current.when), { addSuffix: false })}
          </span>
        </div>
        {items.length > 1 ? (
          <span className="flex-shrink-0 text-[10px] text-[var(--color-muted)] tabular-nums font-mono">
            {index + 1}/{items.length}
          </span>
        ) : null}
      </div>
      <style>{`
        @keyframes liveTickerFade {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
