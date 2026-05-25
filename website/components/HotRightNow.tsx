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

  return (
    <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2">
      <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap sm:gap-3 sm:overflow-x-auto">
        <span className="flex-shrink-0 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-[var(--color-accent)]">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-pulse" />
          Hot now
        </span>
        <ul className="flex min-w-0 flex-wrap gap-2 sm:flex-nowrap">
          {rows.map((r) => (
            <li
              key={r.path}
              className="min-w-0 max-w-full rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-2.5 py-1 flex items-center gap-1.5 sm:flex-shrink-0"
            >
              <span className="text-[10px] font-bold tabular-nums text-[var(--color-accent)]">
                {Number(r.viewers)}
              </span>
              <Link
                href={r.path}
                className="min-w-0 max-w-[70vw] truncate text-xs font-mono text-[var(--color-ink)] hover:text-[var(--color-accent)] sm:max-w-[220px]"
                title={r.path}
              >
                {r.path}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
