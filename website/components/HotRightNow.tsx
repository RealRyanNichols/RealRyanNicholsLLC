"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type Row = { path: string; viewers: bigint | number };

// Tiny live ticker of the top paths being read RIGHT NOW (last 5 min).
// Polls every 15s. Public anon-safe — only path + viewer count, no
// geo or session ids. Renders as a single horizontal scroll strip.
export function HotRightNow({ initial }: { initial: Row[] }) {
  const [rows, setRows] = useState<Row[]>(initial);

  useEffect(() => {
    let mounted = true;
    const supabase = getSupabaseBrowserClient();

    async function pull() {
      const { data } = await supabase.rpc("hot_right_now");
      if (!mounted) return;
      if (Array.isArray(data)) setRows(data as Row[]);
    }
    void pull();
    const id = window.setInterval(pull, 15_000);
    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, []);

  if (rows.length === 0) return null;
  const visibleRows = rows.slice(0, 5);

  return (
    <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-2.5 py-1.5 sm:rounded-xl sm:px-3 sm:py-2">
      <div className="flex min-w-0 items-center gap-2 overflow-hidden">
        <span className="inline-flex shrink-0 items-center gap-1.5 text-[9px] uppercase tracking-wider font-black text-[var(--color-accent)] sm:text-[10px]">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-accent)] animate-pulse" />
          Hot now
        </span>
        <ul className="flex min-w-0 flex-1 snap-x gap-1.5 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-2">
          {visibleRows.map((r) => (
            <li
              key={r.path}
              className="flex max-w-[12rem] shrink-0 snap-start items-center gap-1.5 rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-2 py-0.5 sm:max-w-[16rem] sm:px-2.5 sm:py-1"
            >
              <span className="text-[10px] font-black tabular-nums text-[var(--color-accent)]">
                {Number(r.viewers)}
              </span>
              <Link
                href={r.path}
                className="min-w-0 truncate text-[11px] font-mono text-[var(--color-ink)] hover:text-[var(--color-accent)] sm:text-xs"
                title={r.path}
              >
                {r.path}
              </Link>
            </li>
          ))}
        </ul>
        {rows.length > visibleRows.length ? (
          <span className="shrink-0 text-[10px] font-bold tabular-nums text-[var(--color-muted)]">
            +{rows.length - visibleRows.length}
          </span>
        ) : null}
      </div>
    </div>
  );
}
