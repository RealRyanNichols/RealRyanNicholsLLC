import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { format, formatDistanceToNowStrict, subDays } from "date-fns";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Analytics",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function fmt(n: number | null | undefined): string {
  const v = n ?? 0;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(v);
}

export default async function AdminAnalyticsPage() {
  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=/admin/analytics");
  const { data: adminCheck } = await supabase.rpc("is_admin", { uid: auth.user.id });
  if (adminCheck !== true) {
    return (
      <article className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Not authorized</h1>
      </article>
    );
  }

  const now = new Date();
  const sevenDaysAgo = subDays(now, 7).toISOString();
  const thirtyDaysAgo = subDays(now, 30).toISOString();

  // Pull in parallel
  const [
    { data: postsRaw },
    { count: subsTotal },
    { count: subsLast7 },
    { count: subsLast30 },
    { count: commentsTotal },
    { count: commentsLast7 },
    { data: recentCommentsRaw },
    { data: subsRecentRaw },
    { count: profilesTotal },
    { count: profilesPending },
  ] = await Promise.all([
    supabase
      .from("posts")
      .select("id, slug, type, title, body, pinned, views_count, shares_count, published_at, status, category")
      .eq("status", "published")
      .order("published_at", { ascending: false }),
    supabase
      .from("notify_signups")
      .select("id", { count: "exact", head: true })
      .eq("channel", "email")
      .not("email", "is", null)
      .not("confirmed_at", "is", null)
      .is("unsubscribed_at", null),
    supabase
      .from("notify_signups")
      .select("id", { count: "exact", head: true })
      .eq("channel", "email")
      .not("confirmed_at", "is", null)
      .gte("created_at", sevenDaysAgo),
    supabase
      .from("notify_signups")
      .select("id", { count: "exact", head: true })
      .eq("channel", "email")
      .not("confirmed_at", "is", null)
      .gte("created_at", thirtyDaysAgo),
    supabase
      .from("comments")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved"),
    supabase
      .from("comments")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved")
      .gte("created_at", sevenDaysAgo),
    supabase
      .from("comments")
      .select("id, body, created_at, user_id, post_id")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("notify_signups")
      .select("id, email, created_at, confirmed_at")
      .eq("channel", "email")
      .not("email", "is", null)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  const posts = postsRaw ?? [];
  const totalViews = posts.reduce((s, p) => s + (p.views_count ?? 0), 0);
  const totalShares = posts.reduce((s, p) => s + (p.shares_count ?? 0), 0);
  const topByViews = [...posts].sort((a, b) => (b.views_count ?? 0) - (a.views_count ?? 0)).slice(0, 10);
  const topByShares = [...posts].sort((a, b) => (b.shares_count ?? 0) - (a.shares_count ?? 0)).slice(0, 10);

  const recentComments = recentCommentsRaw ?? [];
  const subsRecent = subsRecentRaw ?? [];

  // Hydrate post titles for recent comments
  const postById = new Map(posts.map((p) => [p.id, p]));

  return (
    <article className="mx-auto max-w-5xl px-4 py-10">
      <p className="text-xs uppercase tracking-wider text-[var(--color-accent)] font-bold">
        Admin · analytics
      </p>
      <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight">
        Attention dashboard
      </h1>
      <p className="mt-2 text-sm text-[var(--color-ink-soft)] max-w-2xl">
        Everything I can show from current data. Per-session dwell time, scroll
        depth, and click maps land in the next PR.
      </p>

      {/* Top-line stats */}
      <section className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Subscribers" value={fmt(subsTotal)} sub={`+${fmt(subsLast7)} this week`} />
        <Stat label="Total views" value={fmt(totalViews)} sub="across all posts" />
        <Stat label="Total shares" value={fmt(totalShares)} sub="all platforms" />
        <Stat label="Comments" value={fmt(commentsTotal)} sub={`+${fmt(commentsLast7)} this week`} />
      </section>

      <section className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Posts published" value={fmt(posts.length)} />
        <Stat label="Subs (30d)" value={fmt(subsLast30)} sub="confirmed signups" />
        <Stat label="User accounts" value={fmt(profilesTotal)} sub={`${fmt(profilesPending)} pending review`} />
        <Stat
          label="Avg views/post"
          value={fmt(posts.length > 0 ? Math.round(totalViews / posts.length) : 0)}
        />
      </section>

      {/* Top posts */}
      <section className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-5">
        <RankedList
          title="Top 10 by views"
          rows={topByViews.map((p) => ({
            href: `/posts/${p.slug}`,
            label: p.title ?? p.body?.slice(0, 60) ?? `(${p.type})`,
            value: p.views_count ?? 0,
            sub: p.published_at
              ? formatDistanceToNowStrict(new Date(p.published_at), { addSuffix: true })
              : undefined,
          }))}
          emptyText="No posts have views yet."
        />
        <RankedList
          title="Top 10 by shares"
          rows={topByShares.map((p) => ({
            href: `/posts/${p.slug}`,
            label: p.title ?? p.body?.slice(0, 60) ?? `(${p.type})`,
            value: p.shares_count ?? 0,
            sub: p.published_at
              ? formatDistanceToNowStrict(new Date(p.published_at), { addSuffix: true })
              : undefined,
          }))}
          emptyText="No shares recorded yet."
        />
      </section>

      {/* Live session data */}
      <LiveSessions />

      {/* Recent activity */}
      <section className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
          <h2 className="text-lg font-bold tracking-tight">Recent subscribers (10 newest)</h2>
          <ul className="mt-3 space-y-2">
            {subsRecent.length === 0 ? (
              <li className="text-sm text-[var(--color-muted)] italic">No subscribers yet.</li>
            ) : (
              subsRecent.map((s) => (
                <li key={s.id} className="text-sm flex items-center justify-between gap-3">
                  <span className="font-mono truncate">{s.email}</span>
                  <span className="text-xs text-[var(--color-muted)] whitespace-nowrap">
                    {s.confirmed_at ? "✓ " : "⏳ "}
                    {formatDistanceToNowStrict(new Date(s.created_at), { addSuffix: true })}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
          <h2 className="text-lg font-bold tracking-tight">Recent comments (10 newest)</h2>
          <ul className="mt-3 space-y-3">
            {recentComments.length === 0 ? (
              <li className="text-sm text-[var(--color-muted)] italic">No comments yet.</li>
            ) : (
              recentComments.map((c) => {
                const post = postById.get(c.post_id);
                return (
                  <li key={c.id} className="text-sm border-l-2 border-[var(--color-line)] pl-3">
                    <p className="line-clamp-2 text-[var(--color-ink-soft)]">{c.body}</p>
                    <p className="text-xs text-[var(--color-muted)] mt-1">
                      on{" "}
                      <Link href={`/posts/${post?.slug ?? ""}`} className="text-[var(--color-accent)] hover:underline">
                        {post?.title ?? "post"}
                      </Link>{" "}
                      · {formatDistanceToNowStrict(new Date(c.created_at), { addSuffix: true })}
                    </p>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </section>

      <p className="mt-10 text-xs text-[var(--color-muted)]">
        Snapshot taken {format(now, "MMM d, yyyy h:mma")} ·{" "}
        <Link href="/admin/users" className="underline">User moderation</Link> ·{" "}
        <Link href="/admin/new" className="underline">New post</Link> ·{" "}
        <Link href="/admin/case" className="underline">Upload case document</Link>
      </p>
    </article>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3">
      <div className="text-3xl font-bold tracking-tight">{value}</div>
      <div className="text-[11px] uppercase tracking-wider text-[var(--color-muted)] mt-1 font-semibold">
        {label}
      </div>
      {sub ? <div className="text-xs text-[var(--color-ink-soft)] mt-1">{sub}</div> : null}
    </div>
  );
}

async function LiveSessions() {
  const supabase = await getSupabaseServerClient();
  const fiveMinAgo = subDays(new Date(), 0);
  fiveMinAgo.setMinutes(fiveMinAgo.getMinutes() - 5);
  const oneHourAgo = subDays(new Date(), 0);
  oneHourAgo.setHours(oneHourAgo.getHours() - 1);
  const oneDayAgo = subDays(new Date(), 1);

  const [
    { count: activeNow },
    { count: sessions24h },
    { data: views24h },
    { data: topClicks },
    { data: recentSessions },
  ] = await Promise.all([
    supabase
      .from("page_views")
      .select("id", { count: "exact", head: true })
      .gte("last_activity_at", fiveMinAgo.toISOString()),
    supabase
      .from("page_views")
      .select("session_id", { count: "exact", head: true })
      .gte("started_at", oneDayAgo.toISOString()),
    supabase
      .from("page_views")
      .select("path, started_at, last_activity_at, scroll_max")
      .gte("started_at", oneDayAgo.toISOString())
      .limit(1000),
    supabase
      .from("page_events")
      .select("target, kind, path")
      .gte("at", oneDayAgo.toISOString())
      .limit(2000),
    supabase
      .from("page_views")
      .select("session_id, user_id, path, started_at, last_activity_at, scroll_max, ref")
      .gte("started_at", oneDayAgo.toISOString())
      .order("started_at", { ascending: false })
      .limit(20),
  ]);

  // Aggregate per-path stats
  const pathStats = new Map<
    string,
    { views: number; totalDwellSec: number; totalScroll: number }
  >();
  let totalDwell = 0;
  let totalDwellCount = 0;
  for (const v of views24h ?? []) {
    const dwell =
      (new Date(v.last_activity_at).getTime() -
        new Date(v.started_at).getTime()) /
      1000;
    const s = pathStats.get(v.path) ?? {
      views: 0,
      totalDwellSec: 0,
      totalScroll: 0,
    };
    s.views += 1;
    s.totalDwellSec += Math.max(0, dwell);
    s.totalScroll += v.scroll_max ?? 0;
    pathStats.set(v.path, s);
    if (dwell > 0 && dwell < 3600) {
      totalDwell += dwell;
      totalDwellCount += 1;
    }
  }
  const topPaths = Array.from(pathStats.entries())
    .map(([path, s]) => ({
      path,
      views: s.views,
      avgDwell: s.views > 0 ? Math.round(s.totalDwellSec / s.views) : 0,
      avgScroll: s.views > 0 ? Math.round(s.totalScroll / s.views) : 0,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  // Aggregate clicks
  const clickAgg = new Map<string, number>();
  for (const e of topClicks ?? []) {
    if (!e.target) continue;
    const key = `${e.kind}: ${e.target}`;
    clickAgg.set(key, (clickAgg.get(key) ?? 0) + 1);
  }
  const topClickList = Array.from(clickAgg.entries())
    .map(([label, n]) => ({ label, n }))
    .sort((a, b) => b.n - a.n)
    .slice(0, 10);

  const avgDwellSec = totalDwellCount > 0 ? Math.round(totalDwell / totalDwellCount) : 0;

  return (
    <>
      <section className="mt-10">
        <h2 className="text-lg font-bold tracking-tight">Live sessions (last 24 hours)</h2>
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat
            label="Active now"
            value={String(activeNow ?? 0)}
            sub="last 5 min"
          />
          <Stat
            label="Page views (24h)"
            value={String(views24h?.length ?? 0)}
          />
          <Stat
            label="Sessions (24h)"
            value={String(sessions24h ?? 0)}
            sub="unique"
          />
          <Stat
            label="Avg dwell"
            value={`${avgDwellSec}s`}
            sub="per page view"
          />
        </div>
      </section>

      <section className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
          <h3 className="text-base font-bold tracking-tight">
            Top pages — views, dwell, scroll
          </h3>
          {topPaths.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--color-muted)] italic">
              No traffic yet in the last 24h.
            </p>
          ) : (
            <table className="mt-3 w-full text-sm">
              <thead className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-bold">
                <tr>
                  <th className="text-left py-1">Path</th>
                  <th className="text-right py-1">Views</th>
                  <th className="text-right py-1">Dwell</th>
                  <th className="text-right py-1">Scroll</th>
                </tr>
              </thead>
              <tbody>
                {topPaths.map((p) => (
                  <tr key={p.path} className="border-t border-[var(--color-line)]">
                    <td className="py-1.5 font-mono text-xs truncate max-w-[180px]">
                      {p.path}
                    </td>
                    <td className="py-1.5 text-right tabular-nums font-semibold">
                      {p.views}
                    </td>
                    <td className="py-1.5 text-right tabular-nums text-[var(--color-ink-soft)]">
                      {p.avgDwell}s
                    </td>
                    <td className="py-1.5 text-right tabular-nums text-[var(--color-ink-soft)]">
                      {p.avgScroll}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="mt-3 text-xs text-[var(--color-muted)]">
            Dwell = time from first to last activity on the page. Scroll = max
            % of the page reached.
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
          <h3 className="text-base font-bold tracking-tight">Top click targets (24h)</h3>
          {topClickList.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--color-muted)] italic">
              No clicks tracked yet.
            </p>
          ) : (
            <ol className="mt-3 space-y-1.5">
              {topClickList.map((c, i) => (
                <li
                  key={c.label}
                  className="flex items-center gap-2 text-xs"
                >
                  <span className="w-5 text-[var(--color-muted)] font-bold">
                    {i + 1}
                  </span>
                  <span className="flex-1 truncate font-mono">{c.label}</span>
                  <span className="font-bold tabular-nums">{c.n}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
        <h3 className="text-base font-bold tracking-tight">
          Recent sessions ({(recentSessions ?? []).length})
        </h3>
        {!recentSessions || recentSessions.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--color-muted)] italic">
            No sessions recorded yet.
          </p>
        ) : (
          <table className="mt-3 w-full text-xs">
            <thead className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-bold">
              <tr>
                <th className="text-left py-1">Session</th>
                <th className="text-left py-1">Path</th>
                <th className="text-right py-1">Dwell</th>
                <th className="text-right py-1">Scroll</th>
                <th className="text-right py-1">User</th>
              </tr>
            </thead>
            <tbody>
              {recentSessions.map((s) => {
                const dwell = Math.max(
                  0,
                  Math.round(
                    (new Date(s.last_activity_at).getTime() -
                      new Date(s.started_at).getTime()) /
                      1000
                  )
                );
                return (
                  <tr
                    key={`${s.session_id}-${s.path}-${s.started_at}`}
                    className="border-t border-[var(--color-line)]"
                  >
                    <td className="py-1.5 font-mono text-[10px] text-[var(--color-muted)]">
                      {s.session_id.slice(0, 8)}
                    </td>
                    <td className="py-1.5 font-mono truncate max-w-[200px]">{s.path}</td>
                    <td className="py-1.5 text-right tabular-nums">{dwell}s</td>
                    <td className="py-1.5 text-right tabular-nums">
                      {s.scroll_max ?? 0}%
                    </td>
                    <td className="py-1.5 text-right">
                      {s.user_id ? "signed in" : "anon"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}

function RankedList({
  title,
  rows,
  emptyText,
}: {
  title: string;
  rows: { href: string; label: string; value: number; sub?: string }[];
  emptyText: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
      <h2 className="text-lg font-bold tracking-tight">{title}</h2>
      <ol className="mt-3 space-y-2">
        {rows.length === 0 ? (
          <li className="text-sm text-[var(--color-muted)] italic">{emptyText}</li>
        ) : (
          rows.map((r, i) => (
            <li key={r.href} className="flex items-center gap-3 text-sm">
              <span className="w-5 text-xs font-bold text-[var(--color-muted)]">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <Link href={r.href} className="font-medium hover:text-[var(--color-accent)] line-clamp-1">
                  {r.label || "Untitled"}
                </Link>
                {r.sub ? <p className="text-xs text-[var(--color-muted)]">{r.sub}</p> : null}
              </div>
              <span className="font-bold tabular-nums">{fmt(r.value)}</span>
            </li>
          ))
        )}
      </ol>
    </div>
  );
}
