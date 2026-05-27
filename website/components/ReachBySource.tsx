import Link from "next/link";
import { format, formatDistanceToNowStrict } from "date-fns";
import { getSupabaseServerClient } from "@/lib/supabase/server";

// Reads arrivals_overview() — the edge-middleware page_arrivals truth — and
// shows reach broken down by source class (human / AI / search / social /
// uptime), a stacked daily series, top posts (human vs bot), geo, referrers,
// and a live feed. This is the audit-honest view: every successful page-load
// counts, and you can toggle your own admin activity out.

type Overview = {
  error?: string;
  total?: number;
  self_total?: number;
  exclude_self?: boolean;
  by_class?: Record<string, number>;
  by_day?: { day: string; human: number; ai: number; search: number; social: number; uptime: number; unknown: number; total: number }[];
  top_posts?: { path: string; total: number; human: number; bots: number }[];
  top_countries?: { country: string; n: number }[];
  top_referrers?: { host: string; n: number }[];
  recent?: { path: string; ua_class: string; country: string | null; referrer_host: string | null; is_self: boolean; at: string }[];
};

const CLASS_META: { key: string; label: string; color: string }[] = [
  { key: "human", label: "Humans", color: "var(--color-accent)" },
  { key: "search-bot", label: "Search bots", color: "#3b82f6" },
  { key: "ai-bot", label: "AI agents", color: "#a855f7" },
  { key: "social-bot", label: "Social previews", color: "#22c55e" },
  { key: "uptime-bot", label: "Uptime/tools", color: "#9ca3af" },
  { key: "unknown", label: "Unclassified", color: "#6b7280" },
];

function fmt(n: number | null | undefined): string {
  const v = n ?? 0;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(v);
}

export async function ReachBySource({ excludeSelf }: { excludeSelf: boolean }) {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase.rpc("arrivals_overview", {
    p_days: 14,
    p_exclude_self: excludeSelf,
  });
  const o = (data ?? {}) as Overview;

  if (o.error) {
    return null;
  }

  const total = o.total ?? 0;
  const byClass = o.by_class ?? {};
  const byDay = o.by_day ?? [];
  const maxDay = Math.max(1, ...byDay.map((d) => d.total));
  const humanTotal = byClass["human"] ?? 0;
  const botTotal = total - humanTotal;

  return (
    <section
      id="reach-by-source"
      className="mt-10 rounded-2xl border-2 border-[var(--color-accent)] bg-[var(--color-surface)] p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Reach by source · last 14 days</h2>
          <p className="mt-1 text-xs text-[var(--color-muted)] max-w-xl">
            The audit-honest view, straight from edge middleware. Every successful
            page-load is one arrival — humans, AI agents, social link-previews,
            search crawlers. Your own admin visits count once per post.
            {total === 0 ? " (No arrivals recorded yet — this fills in once the new tracking is deployed and live.)" : ""}
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-full border border-[var(--color-line)] p-1 text-xs">
          <Link
            href="/admin/analytics?reach=all#reach-by-source"
            className={`rounded-full px-3 py-1 font-bold ${!excludeSelf ? "bg-[var(--color-accent)] text-[var(--color-paper)]" : "text-[var(--color-ink-soft)]"}`}
          >
            Everyone
          </Link>
          <Link
            href="/admin/analytics?reach=strict#reach-by-source"
            className={`rounded-full px-3 py-1 font-bold ${excludeSelf ? "bg-[var(--color-accent)] text-[var(--color-paper)]" : "text-[var(--color-ink-soft)]"}`}
          >
            Exclude my activity
          </Link>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MiniStat label="Total reach (14d)" value={fmt(total)} sub={`${fmt(o.self_total)} were your own`} />
        <MiniStat label="Human" value={fmt(humanTotal)} sub={pct(humanTotal, total)} />
        <MiniStat label="Bots / agents" value={fmt(botTotal)} sub={pct(botTotal, total)} />
        <MiniStat label="AI agents" value={fmt(byClass["ai-bot"])} sub={pct(byClass["ai-bot"] ?? 0, total)} />
      </div>

      {/* Class legend + totals */}
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {CLASS_META.map((c) => (
          <span key={c.key} className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: c.color }} />
            <span className="text-[var(--color-ink-soft)]">{c.label}</span>
            <span className="font-bold tabular-nums">{fmt(byClass[c.key])}</span>
          </span>
        ))}
      </div>

      {/* Stacked daily series */}
      <div className="mt-5">
        <h3 className="text-sm font-bold tracking-tight mb-2">Daily arrivals (stacked by source)</h3>
        <div className="space-y-1">
          {byDay.map((d) => (
            <div key={d.day} className="flex items-center gap-2">
              <span className="w-14 text-[10px] text-[var(--color-muted)] tabular-nums">
                {format(new Date(d.day), "MMM d")}
              </span>
              <div className="flex-1 flex h-3 rounded-sm overflow-hidden bg-[var(--color-line)]/40">
                {CLASS_META.map((c) => {
                  const n =
                    c.key === "search-bot" ? d.search
                    : c.key === "ai-bot" ? d.ai
                    : c.key === "social-bot" ? d.social
                    : c.key === "uptime-bot" ? d.uptime
                    : c.key === "unknown" ? d.unknown
                    : d.human;
                  if (!n) return null;
                  return <div key={c.key} style={{ width: `${(n / maxDay) * 100}%`, background: c.color }} />;
                })}
              </div>
              <span className="w-10 text-right text-[10px] tabular-nums text-[var(--color-ink-soft)]">
                {fmt(d.total)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Top posts: human vs bot */}
        <div>
          <h3 className="text-sm font-bold tracking-tight">Top posts by reach (human vs bot)</h3>
          {(o.top_posts ?? []).length === 0 ? (
            <p className="mt-2 text-xs text-[var(--color-muted)] italic">No post arrivals yet.</p>
          ) : (
            <table className="mt-2 w-full text-xs">
              <thead className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-bold">
                <tr>
                  <th className="text-left py-1">Post</th>
                  <th className="text-right py-1">Total</th>
                  <th className="text-right py-1">Human</th>
                  <th className="text-right py-1">Bot</th>
                </tr>
              </thead>
              <tbody>
                {(o.top_posts ?? []).map((p) => (
                  <tr key={p.path} className="border-t border-[var(--color-line)]">
                    <td className="py-1.5 font-mono truncate max-w-[200px]">
                      <Link href={p.path} className="hover:text-[var(--color-accent)]">{p.path.replace("/posts/", "")}</Link>
                    </td>
                    <td className="py-1.5 text-right tabular-nums font-bold">{fmt(p.total)}</td>
                    <td className="py-1.5 text-right tabular-nums text-[var(--color-accent)]">{fmt(p.human)}</td>
                    <td className="py-1.5 text-right tabular-nums text-[var(--color-muted)]">{fmt(p.bots)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Geo + referrers */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-bold tracking-tight">Top countries</h3>
            <ul className="mt-2 space-y-1 text-xs">
              {(o.top_countries ?? []).length === 0 ? (
                <li className="text-[var(--color-muted)] italic">No geo yet.</li>
              ) : (
                (o.top_countries ?? []).map((c) => (
                  <li key={c.country} className="flex justify-between gap-2">
                    <span className="font-mono">{c.country}</span>
                    <span className="font-bold tabular-nums">{fmt(c.n)}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight">Top referrers</h3>
            <ul className="mt-2 space-y-1 text-xs">
              {(o.top_referrers ?? []).length === 0 ? (
                <li className="text-[var(--color-muted)] italic">No referrers yet.</li>
              ) : (
                (o.top_referrers ?? []).map((r) => (
                  <li key={r.host} className="flex justify-between gap-2">
                    <span className="font-mono truncate">{r.host}</span>
                    <span className="font-bold tabular-nums">{fmt(r.n)}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Live feed */}
      <div className="mt-6">
        <h3 className="text-sm font-bold tracking-tight">Recent arrivals</h3>
        {(o.recent ?? []).length === 0 ? (
          <p className="mt-2 text-xs text-[var(--color-muted)] italic">No arrivals recorded yet.</p>
        ) : (
          <ul className="mt-2 space-y-1 max-h-72 overflow-y-auto">
            {(o.recent ?? []).map((r, i) => (
              <li key={`${r.at}-${i}`} className="flex items-center gap-2 text-[11px]">
                <span className="inline-block h-2 w-2 rounded-sm shrink-0" style={{ background: classColor(r.ua_class) }} />
                <span className="font-mono truncate flex-1">{r.path}</span>
                <span className="text-[var(--color-muted)] shrink-0">{r.ua_class}</span>
                {r.country ? <span className="text-[var(--color-muted)] shrink-0">{r.country}</span> : null}
                {r.is_self ? <span className="text-[var(--color-accent)] shrink-0">you</span> : null}
                <span className="text-[var(--color-muted)] shrink-0 whitespace-nowrap">
                  {formatDistanceToNowStrict(new Date(r.at), { addSuffix: true })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="mt-4 text-[11px] text-[var(--color-muted)]">
        Methodology is public at{" "}
        <Link href="/about/numbers" className="underline">/about/numbers</Link>.
      </p>
    </section>
  );
}

function pct(part: number, whole: number): string {
  if (whole <= 0) return "0%";
  return `${Math.round((part / whole) * 100)}% of reach`;
}

function classColor(key: string): string {
  return CLASS_META.find((c) => c.key === key)?.color ?? "#6b7280";
}

function MiniStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] px-4 py-3">
      <div className="text-2xl font-bold tracking-tight tabular-nums">{value}</div>
      <div className="text-[11px] uppercase tracking-wider text-[var(--color-muted)] mt-1 font-semibold">{label}</div>
      {sub ? <div className="text-xs text-[var(--color-ink-soft)] mt-0.5">{sub}</div> : null}
    </div>
  );
}
