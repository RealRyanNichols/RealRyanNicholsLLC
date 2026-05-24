import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { format, formatDistanceToNowStrict, subDays } from "date-fns";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { WorldMap } from "@/components/WorldMap";
import { flagFor, nameFor } from "@/lib/country-coords";
import { normalizeVideoChannel } from "@/lib/video-channels";

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
    { data: caseGrievancesRaw },
    { data: caseEventsRaw },
    { data: caseDocumentsRaw },
    { data: casePeopleRaw },
    { count: j6DefendantsTotal },
    { count: j6DefendantsClaimed },
    { count: pendingClaims },
    { count: pendingTips },
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
    supabase
      .from("case_grievances")
      .select("id, slug, title, views_count, shares_count")
      .eq("visibility", "public")
      .order("views_count", { ascending: false })
      .limit(10),
    supabase
      .from("case_events")
      .select("id, slug, title, views_count, shares_count")
      .eq("visibility", "public")
      .order("views_count", { ascending: false })
      .limit(10),
    supabase
      .from("case_documents")
      .select("id, slug, title, views_count, shares_count")
      .eq("visibility", "public")
      .eq("archived", false)
      .order("views_count", { ascending: false })
      .limit(10),
    supabase
      .from("case_people")
      .select("id, slug, name, views_count, shares_count, claim_status")
      .eq("visibility", "public")
      .order("views_count", { ascending: false })
      .limit(10),
    supabase
      .from("case_people")
      .select("id", { count: "exact", head: true })
      .eq("is_j6_defendant", true),
    supabase
      .from("case_people")
      .select("id", { count: "exact", head: true })
      .eq("is_j6_defendant", true)
      .eq("claim_status", "verified"),
    supabase
      .from("case_person_claims")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("case_tips")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  const posts = postsRaw ?? [];
  const totalPostViews = posts.reduce((s, p) => s + (p.views_count ?? 0), 0);
  const totalPostShares = posts.reduce((s, p) => s + (p.shares_count ?? 0), 0);
  const topByViews = [...posts].sort((a, b) => (b.views_count ?? 0) - (a.views_count ?? 0)).slice(0, 10);
  const topByShares = [...posts].sort((a, b) => (b.shares_count ?? 0) - (a.shares_count ?? 0)).slice(0, 10);
  const videoPosts = posts.filter((p) => p.type === "video");
  const videoViews = videoPosts.reduce((s, p) => s + (p.views_count ?? 0), 0);
  const videoShares = videoPosts.reduce((s, p) => s + (p.shares_count ?? 0), 0);
  const videoChannelRows = [...videoPosts.reduce((map, p) => {
    const channel = normalizeVideoChannel(p.category);
    const existing = map.get(channel) ?? { channel, count: 0, views: 0, shares: 0 };
    existing.count += 1;
    existing.views += p.views_count ?? 0;
    existing.shares += p.shares_count ?? 0;
    map.set(channel, existing);
    return map;
  }, new Map<string, { channel: string; count: number; views: number; shares: number }>()).values()]
    .sort((a, b) => b.views - a.views || b.shares - a.shares || b.count - a.count)
    .slice(0, 10);

  const caseGrievances = caseGrievancesRaw ?? [];
  const caseEvents = caseEventsRaw ?? [];
  const caseDocuments = caseDocumentsRaw ?? [];
  const casePeople = casePeopleRaw ?? [];
  const sumViews = (rows: { views_count: number | null }[]) =>
    rows.reduce((s, r) => s + (r.views_count ?? 0), 0);
  const sumShares = (rows: { shares_count: number | null }[]) =>
    rows.reduce((s, r) => s + (r.shares_count ?? 0), 0);
  const caseViews =
    sumViews(caseGrievances) +
    sumViews(caseEvents) +
    sumViews(caseDocuments) +
    sumViews(casePeople);
  const caseShares =
    sumShares(caseGrievances) +
    sumShares(caseEvents) +
    sumShares(caseDocuments) +
    sumShares(casePeople);
  const totalViews = totalPostViews + caseViews;
  const totalShares = totalPostShares + caseShares;

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
        Everything from the page-view beacon — geo, referrers, devices,
        dwell, scroll, clicks, per-defendant profile views. Country and
        city come from Vercel&apos;s free request headers; no IPs are
        stored. Visitor counts use a daily-rotating one-way hash.
      </p>

      {/* Top-line stats — site-wide, includes posts + case archive */}
      <section className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat
          href="#recent-subscribers"
          label="Subscribers"
          value={fmt(subsTotal)}
          sub={`+${fmt(subsLast7)} this week`}
        />
        <Stat
          href="#live-sessions"
          label="Total views"
          value={fmt(totalViews)}
          sub={`${fmt(totalPostViews)} posts · ${fmt(caseViews)} case`}
        />
        <Stat
          href="#top-content"
          label="Total shares"
          value={fmt(totalShares)}
          sub={`${fmt(totalPostShares)} posts · ${fmt(caseShares)} case`}
        />
        <Stat
          href="#recent-comments"
          label="Comments"
          value={fmt(commentsTotal)}
          sub={`+${fmt(commentsLast7)} this week`}
        />
      </section>

      <section className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat
          href="/case/nexus"
          label="J6 defendants"
          value={fmt(j6DefendantsTotal)}
          sub={`${fmt(j6DefendantsClaimed)} verified`}
        />
        <Stat
          href="/admin/claims"
          label="Pending claims"
          value={fmt(pendingClaims)}
          sub={`${fmt(pendingTips)} tip-line items`}
        />
        <Stat
          href="#recent-subscribers"
          label="Subs (30d)"
          value={fmt(subsLast30)}
          sub="confirmed signups"
        />
        <Stat
          href="/admin/users"
          label="User accounts"
          value={fmt(profilesTotal)}
          sub={`${fmt(profilesPending)} pending review`}
        />
      </section>

      <section className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat
          href="/videos"
          label="Videos published"
          value={fmt(videoPosts.length)}
          sub={`${fmt(videoViews)} views`}
        />
        <Stat
          href="#video-channels"
          label="Video shares"
          value={fmt(videoShares)}
          sub="owned-site playback"
        />
        <Stat
          href="/admin/new"
          label="Post a video"
          value="New"
          sub="channel + upload"
        />
        <Stat
          href="/admin/posts?filter=draft"
          label="Draft queue"
          value="Open"
          sub="publish queue"
        />
      </section>

      <TrackerHealth />
      <AttentionFunnel />

      {/* Top posts */}
      <section id="top-content" className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-5">
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

      <section id="video-channels" className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-5">
        <RankedList
          title="Video channels by views"
          rows={videoChannelRows.map((row) => ({
            href: `/videos#${channelId(row.channel)}`,
            label: row.channel,
            value: row.views,
            sub: `${row.count} video${row.count === 1 ? "" : "s"} · ${row.shares.toLocaleString()} shares`,
          }))}
          emptyText="No public videos yet."
        />
        <RankedList
          title="Top videos by views"
          rows={videoPosts
            .sort((a, b) => (b.views_count ?? 0) - (a.views_count ?? 0))
            .slice(0, 10)
            .map((p) => ({
              href: `/posts/${p.slug}`,
              label: p.title ?? p.body?.slice(0, 60) ?? "(video)",
              value: p.views_count ?? 0,
              sub: `${normalizeVideoChannel(p.category)} · ${(p.shares_count ?? 0).toLocaleString()} shares`,
            }))}
          emptyText="No public videos yet."
        />
      </section>

      {/* Case archive attention — what's getting clicked across grievances,
          events, documents, and people (including unclaimed J6 profiles). */}
      <section className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-5">
        <RankedList
          title="Top J6 profiles by views"
          rows={casePeople.slice(0, 10).map((p) => ({
            href: `/case/people/${p.slug}`,
            label: `${p.name}${
              p.claim_status === "verified"
                ? " · ✓ verified"
                : p.claim_status === "pending"
                ? " · claim pending"
                : ""
            }`,
            value: p.views_count ?? 0,
            sub: `${(p.shares_count ?? 0).toLocaleString()} shares`,
          }))}
          emptyText="No profile views yet."
        />
        <RankedList
          title="Top documents by views"
          rows={caseDocuments.slice(0, 10).map((d) => ({
            href: `/case/documents/${d.slug}`,
            label: d.title ?? "(untitled)",
            value: d.views_count ?? 0,
            sub: `${(d.shares_count ?? 0).toLocaleString()} shares`,
          }))}
          emptyText="No document views yet."
        />
      </section>

      <section className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
        <RankedList
          title="Top grievances by views"
          rows={caseGrievances.slice(0, 10).map((g) => ({
            href: `/case/grievances/${g.slug}`,
            label: g.title ?? "(untitled)",
            value: g.views_count ?? 0,
            sub: `${(g.shares_count ?? 0).toLocaleString()} shares`,
          }))}
          emptyText="No grievance views yet."
        />
        <RankedList
          title="Top timeline events by views"
          rows={caseEvents.slice(0, 10).map((e) => ({
            href: `/case/events/${e.slug}`,
            label: e.title ?? "(untitled)",
            value: e.views_count ?? 0,
            sub: `${(e.shares_count ?? 0).toLocaleString()} shares`,
          }))}
          emptyText="No event views yet."
        />
      </section>

      {/* Live session data */}
      <LiveSessions />

      <NexusAttention />

      {/* Geography + referrer chain — pulls from analytics_summary
          and analytics_live_visitors which read the new geo columns
          on page_views. */}
      <Geography />

      {/* Per-defendant view counts — which J6 profile got the most
          eyes this week. */}
      <TopDefendantProfiles />

      {/* Recent activity */}
      <section className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-5">
        <div
          id="recent-subscribers"
          className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5"
        >
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

        <div
          id="recent-comments"
          className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5"
        >
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

function channelId(channel: string): string {
  return channel.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function Stat({
  label,
  value,
  sub,
  href,
}: {
  label: string;
  value: string;
  sub?: string;
  href?: string;
}) {
  const body = (
    <>
      <div className="text-3xl font-bold tracking-tight">{value}</div>
      <div className="text-[11px] uppercase tracking-wider text-[var(--color-muted)] mt-1 font-semibold">
        {label}
      </div>
      {sub ? <div className="text-xs text-[var(--color-ink-soft)] mt-1">{sub}</div> : null}
    </>
  );
  const classes =
    "rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3";
  if (href) {
    return (
      <Link
        href={href}
        className={`${classes} block transition hover:border-[var(--color-accent)] hover:-translate-y-0.5`}
      >
        {body}
      </Link>
    );
  }
  return <div className={classes}>{body}</div>;
}

async function TrackerHealth() {
  const supabase = await getSupabaseServerClient();
  const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const [
    { count: views15 },
    { count: events15 },
    { count: views60 },
    { count: events60 },
    { data: latestViews },
    { data: latestEvents },
  ] = await Promise.all([
    supabase
      .from("page_views")
      .select("id", { count: "exact", head: true })
      .gte("started_at", fifteenMinAgo),
    supabase
      .from("page_events")
      .select("id", { count: "exact", head: true })
      .gte("at", fifteenMinAgo),
    supabase
      .from("page_views")
      .select("id", { count: "exact", head: true })
      .gte("started_at", oneHourAgo),
    supabase
      .from("page_events")
      .select("id", { count: "exact", head: true })
      .gte("at", oneHourAgo),
    supabase
      .from("page_views")
      .select("started_at, path")
      .order("started_at", { ascending: false })
      .limit(1),
    supabase
      .from("page_events")
      .select("at, kind, path")
      .order("at", { ascending: false })
      .limit(1),
  ]);

  const latestView = latestViews?.[0] ?? null;
  const latestEvent = latestEvents?.[0] ?? null;
  const writingNow = (views15 ?? 0) > 0 || (events15 ?? 0) > 0;

  return (
    <section
      id="tracker-health"
      className="mt-6 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Tracker health</h2>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            First-party collector status, pulled from live page_views and page_events.
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
            writingNow
              ? "bg-[var(--color-success)]/15 text-[var(--color-success)]"
              : "bg-[var(--color-danger)]/15 text-[var(--color-danger)]"
          }`}
        >
          {writingNow ? "Writing now" : "Quiet"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Views (15m)" value={fmt(views15)} sub={`${fmt(views60)} in 1h`} />
        <Stat label="Events (15m)" value={fmt(events15)} sub={`${fmt(events60)} in 1h`} />
        <Stat
          href={latestView?.path || undefined}
          label="Latest view"
          value={latestView ? formatDistanceToNowStrict(new Date(latestView.started_at), { addSuffix: true }) : "none"}
          sub={latestView?.path ?? "no path yet"}
        />
        <Stat
          href={latestEvent?.path || undefined}
          label="Latest event"
          value={latestEvent ? formatDistanceToNowStrict(new Date(latestEvent.at), { addSuffix: true }) : "none"}
          sub={latestEvent?.kind ?? "no event yet"}
        />
      </div>
    </section>
  );
}

type EventRow = {
  kind: string | null;
  target: string | null;
  path: string | null;
  at: string;
};

function countKinds(rows: EventRow[], kinds: string[]): number {
  const wanted = new Set(kinds);
  return rows.reduce((sum, row) => sum + (row.kind && wanted.has(row.kind) ? 1 : 0), 0);
}

function percent(part: number, whole: number): string {
  if (whole <= 0) return "0%";
  return `${Math.round((part / whole) * 100)}%`;
}

async function AttentionFunnel() {
  const supabase = await getSupabaseServerClient();
  const oneDayAgo = subDays(new Date(), 1).toISOString();
  const sevenDaysAgo = subDays(new Date(), 7).toISOString();

  const [
    { count: views24 },
    { count: views7 },
    { data: events24Raw },
    { data: events7Raw },
  ] = await Promise.all([
    supabase
      .from("page_views")
      .select("id", { count: "exact", head: true })
      .gte("started_at", oneDayAgo),
    supabase
      .from("page_views")
      .select("id", { count: "exact", head: true })
      .gte("started_at", sevenDaysAgo),
    supabase
      .from("page_events")
      .select("kind, target, path, at")
      .gte("at", oneDayAgo)
      .order("at", { ascending: false })
      .limit(5000),
    supabase
      .from("page_events")
      .select("kind, target, path, at")
      .gte("at", sevenDaysAgo)
      .order("at", { ascending: false })
      .limit(5000),
  ]);

  const events24 = (events24Raw ?? []) as EventRow[];
  const events7 = (events7Raw ?? []) as EventRow[];

  const videoPlays7 = countKinds(events7, ["video_play"]);
  const videoHalf7 = countKinds(events7, ["video_progress_50"]);
  const videoDone7 = countKinds(events7, ["video_complete"]);
  const livePlays7 = countKinds(events7, ["live_play", "live_replay_play"]);
  const shareOpens7 = countKinds(events7, ["share_menu_open"]);
  const shares7 = countKinds(events7, ["share_copy", "share_native", "share_platform"]);
  const commentStarts7 = countKinds(events7, ["comment_start", "case_comment_start"]);
  const commentSends7 = countKinds(events7, ["comment_submit_success", "case_comment_submit_success"]);
  const supportStarts7 = countKinds(events7, ["support_intent_attempt"]);
  const supportSaved7 = countKinds(events7, ["support_intent_saved"]);
  const checkout7 = countKinds(events7, ["support_checkout_open"]);
  const tipAttempts7 = countKinds(events7, ["tip_submit_attempt"]);
  const tipWins7 = countKinds(events7, ["tip_submit_success"]);
  const subscribeAttempts7 = countKinds(events7, ["subscribe_attempt", "follow_capture_attempt"]);
  const subscribeWins7 = countKinds(events7, ["subscribe_success", "follow_capture_success"]);
  const reactions7 = countKinds(events7, ["reaction_toggle"]);

  const topEventCounts = new Map<string, number>();
  for (const event of events7) {
    if (!event.kind) continue;
    topEventCounts.set(event.kind, (topEventCounts.get(event.kind) ?? 0) + 1);
  }
  const topEvents = Array.from(topEventCounts.entries())
    .map(([kind, n]) => ({ kind, n }))
    .sort((a, b) => b.n - a.n)
    .slice(0, 12);

  const attentionActions = [
    {
      label: "Video retention",
      href: "/videos",
      value: `${percent(videoHalf7, videoPlays7)} hit halfway`,
      sub: `${fmt(videoPlays7)} plays · ${fmt(videoHalf7)} halfway · ${fmt(videoDone7)} complete`,
    },
    {
      label: "Live pull",
      href: "/admin/live",
      value: fmt(livePlays7),
      sub: "live or replay plays",
    },
    {
      label: "Share conversion",
      href: "#top-content",
      value: `${percent(shares7, shareOpens7)} complete`,
      sub: `${fmt(shareOpens7)} menus · ${fmt(shares7)} shares/copies`,
    },
    {
      label: "Public conversation",
      href: "#recent-comments",
      value: `${percent(commentSends7, commentStarts7)} posted`,
      sub: `${fmt(commentStarts7)} starts · ${fmt(commentSends7)} submitted`,
    },
    {
      label: "Support intent",
      href: "/support#support-mission",
      value: `${percent(supportSaved7, supportStarts7)} saved`,
      sub: `${fmt(supportStarts7)} starts · ${fmt(checkout7)} checkout opens`,
    },
    {
      label: "Subscriber capture",
      href: "#recent-subscribers",
      value: `${percent(subscribeWins7, subscribeAttempts7)} captured`,
      sub: `${fmt(subscribeAttempts7)} attempts · ${fmt(subscribeWins7)} success`,
    },
    {
      label: "Direct tips",
      href: "/admin/tips",
      value: `${percent(tipWins7, tipAttempts7)} received`,
      sub: `${fmt(tipAttempts7)} starts · ${fmt(tipWins7)} submitted`,
    },
    {
      label: "Reactions",
      href: "#recent-comments",
      value: fmt(reactions7),
      sub: "public proof taps",
    },
  ];

  return (
    <section
      id="attention-funnel"
      className="mt-6 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Attention funnel</h2>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            The public path: watch, react, share, comment, subscribe, support.
          </p>
        </div>
        <span className="rounded-full bg-[var(--color-accent-soft)] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-accent)]">
          Last 7 days
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Views (24h)" value={fmt(views24)} sub={`${fmt(events24.length)} events`} />
        <Stat label="Views (7d)" value={fmt(views7)} sub={`${fmt(events7.length)} events`} />
        <Stat label="Shares (7d)" value={fmt(shares7)} sub={`${fmt(shareOpens7)} menus opened`} />
        <Stat label="Public actions" value={fmt(commentSends7 + reactions7)} sub="comments + reactions" />
      </div>

      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <h3 className="text-base font-bold tracking-tight">Conversion checkpoints</h3>
          <div className="mt-3 space-y-2">
            {attentionActions.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="block rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] p-3 transition hover:border-[var(--color-accent)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-bold">{item.label}</span>
                  <span className="text-sm font-mono font-bold text-[var(--color-accent)]">
                    {item.value}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[var(--color-muted)]">{item.sub}</p>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-base font-bold tracking-tight">Top event names</h3>
          {topEvents.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--color-muted)] italic">
              No named attention events yet.
            </p>
          ) : (
            <ol className="mt-3 space-y-1.5">
              {topEvents.map((event, i) => (
                <li key={event.kind} className="flex items-center gap-3 text-sm">
                  <span className="w-5 text-xs font-bold text-[var(--color-muted)]">
                    {i + 1}
                  </span>
                  <span className="flex-1 truncate font-mono">{event.kind}</span>
                  <span className="font-bold tabular-nums">{fmt(event.n)}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </section>
  );
}

async function NexusAttention() {
  const supabase = await getSupabaseServerClient();
  const sevenDaysAgo = subDays(new Date(), 7).toISOString();
  const thirtyDaysAgo = subDays(new Date(), 30).toISOString();

  const [
    { count: views7 },
    { count: views30 },
    { data: events7 },
    { data: recentEvents },
  ] = await Promise.all([
    supabase
      .from("page_views")
      .select("id", { count: "exact", head: true })
      .like("path", "/case/nexus%")
      .gte("started_at", sevenDaysAgo),
    supabase
      .from("page_views")
      .select("id", { count: "exact", head: true })
      .like("path", "/case/nexus%")
      .gte("started_at", thirtyDaysAgo),
    supabase
      .from("page_events")
      .select("kind, target, at, path")
      .like("kind", "nexus_%")
      .gte("at", sevenDaysAgo)
      .order("at", { ascending: false })
      .limit(1000),
    supabase
      .from("page_events")
      .select("kind, target, at, path")
      .like("kind", "nexus_%")
      .order("at", { ascending: false })
      .limit(8),
  ]);

  const eventRows = events7 ?? [];
  const eventCounts = new Map<string, number>();
  for (const row of eventRows) {
    eventCounts.set(row.kind, (eventCounts.get(row.kind) ?? 0) + 1);
  }
  const topEvents = Array.from(eventCounts.entries())
    .map(([kind, n]) => ({ kind, n }))
    .sort((a, b) => b.n - a.n)
    .slice(0, 8);

  const nodeSelects = eventCounts.get("nexus_node_select") ?? 0;
  const searches = eventCounts.get("nexus_search") ?? 0;

  return (
    <section
      id="nexus-attention"
      className="mt-10 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Nexus attention</h2>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            Searches, node clicks, expansions, and failed loads from /case/nexus.
          </p>
        </div>
        <Link
          href="/case/nexus"
          className="text-xs font-semibold text-[var(--color-accent)] hover:underline"
        >
          Open Nexus →
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat href="/case/nexus" label="Nexus views" value={fmt(views7)} sub={`${fmt(views30)} in 30d`} />
        <Stat label="Nexus events" value={fmt(eventRows.length)} sub="last 7d" />
        <Stat label="Node selects" value={fmt(nodeSelects)} sub="graph/search clicks" />
        <Stat label="Searches" value={fmt(searches)} sub="queries without raw text" />
      </div>

      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <h3 className="text-base font-bold tracking-tight">Top Nexus events (7d)</h3>
          {topEvents.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--color-muted)] italic">
              No Nexus interaction events yet.
            </p>
          ) : (
            <ol className="mt-3 space-y-1.5">
              {topEvents.map((event, i) => (
                <li key={event.kind} className="flex items-center gap-3 text-sm">
                  <span className="w-5 text-xs font-bold text-[var(--color-muted)]">
                    {i + 1}
                  </span>
                  <span className="flex-1 truncate font-mono">{event.kind}</span>
                  <span className="font-bold tabular-nums">{fmt(event.n)}</span>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div>
          <h3 className="text-base font-bold tracking-tight">Recent Nexus events</h3>
          {!recentEvents || recentEvents.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--color-muted)] italic">
              No recent Nexus events.
            </p>
          ) : (
            <ul className="mt-3 space-y-1.5">
              {recentEvents.map((event) => (
                <li
                  key={`${event.kind}-${event.at}-${event.path}`}
                  className="flex items-center gap-3 text-xs"
                >
                  <span className="flex-1 truncate font-mono">{event.kind}</span>
                  <span className="text-[var(--color-muted)] whitespace-nowrap">
                    {formatDistanceToNowStrict(new Date(event.at), { addSuffix: true })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
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

async function Geography() {
  const supabase = await getSupabaseServerClient();
  const [{ data: sum7 }, { data: sum30 }, { data: live }] = await Promise.all([
    supabase.rpc("analytics_summary", { days: 7 }),
    supabase.rpc("analytics_summary", { days: 30 }),
    supabase.rpc("analytics_live_visitors"),
  ]);

  type Summary = {
    views_total?: number;
    unique_visitors?: number;
    sessions?: number;
    live_now?: number;
    top_countries?: Array<{ country: string; views: number }>;
    top_cities?: Array<{
      country: string;
      region: string | null;
      city: string;
      views: number;
    }>;
    top_referrers?: Array<{ host: string; views: number }>;
    top_pages?: Array<{ path: string; views: number }>;
    devices?: Record<string, number>;
    heatmap?: Array<[number, number, number]>; // [dow, hr, n]
  };
  const s7 = (sum7 ?? {}) as Summary;
  const s30 = (sum30 ?? {}) as Summary;
  type LiveRow = {
    sid: string;
    country: string | null;
    region: string | null;
    city: string | null;
    path: string;
    last_seen: string;
  };
  const liveList = ((live ?? []) as LiveRow[]).slice(0, 50);
  const countries7 = s7.top_countries ?? [];

  return (
    <>
      <section className="mt-10">
        <h2 className="text-lg font-bold tracking-tight">
          Who&apos;s reading — last 7 days
        </h2>
        <p className="mt-1 text-xs text-[var(--color-muted)]">
          Country / region / city pulled from Vercel&apos;s free request
          headers. No IPs stored. Visitor counts use a daily-rotating
          one-way hash.
        </p>
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat
            label="Live right now"
            value={fmt(s7.live_now ?? 0)}
            sub="last 5 min"
          />
          <Stat
            label="Unique visitors (7d)"
            value={fmt(s7.unique_visitors ?? 0)}
            sub={`${fmt(s7.sessions ?? 0)} sessions`}
          />
          <Stat
            label="Views (7d)"
            value={fmt(s7.views_total ?? 0)}
            sub={`${fmt(s30.views_total ?? 0)} 30d`}
          />
          <Stat
            label="Countries (7d)"
            value={fmt(countries7.length)}
            sub={
              s7.devices
                ? Object.entries(s7.devices)
                    .filter(([k]) => k !== "bot" && k !== "unknown")
                    .sort(([, a], [, b]) => (b ?? 0) - (a ?? 0))
                    .slice(0, 2)
                    .map(([k, n]) => `${k} ${fmt(n)}`)
                    .join(" · ")
                : undefined
            }
          />
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
        <h3 className="text-base font-bold tracking-tight">
          World map — views by country (7d)
        </h3>
        {countries7.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--color-muted)] italic">
            No geo data yet — first visits with country headers haven&apos;t
            landed. Visit the site from outside admin once and refresh.
          </p>
        ) : (
          <div className="mt-3">
            <WorldMap data={countries7} />
          </div>
        )}
      </section>

      <section className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
          <h3 className="text-base font-bold tracking-tight">
            Top countries (7d)
          </h3>
          {countries7.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--color-muted)] italic">
              No country data yet.
            </p>
          ) : (
            <ol className="mt-3 space-y-1.5">
              {countries7.slice(0, 15).map((c, i) => (
                <li
                  key={c.country}
                  className="flex items-center gap-3 text-sm"
                >
                  <span className="w-5 text-xs font-bold text-[var(--color-muted)]">
                    {i + 1}
                  </span>
                  <span className="text-lg leading-none" aria-hidden>
                    {flagFor(c.country)}
                  </span>
                  <span className="flex-1 truncate">{nameFor(c.country)}</span>
                  <span className="font-bold tabular-nums">
                    {fmt(c.views)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
          <h3 className="text-base font-bold tracking-tight">
            Top cities (7d)
          </h3>
          {(s7.top_cities ?? []).length === 0 ? (
            <p className="mt-3 text-sm text-[var(--color-muted)] italic">
              No city data yet.
            </p>
          ) : (
            <ol className="mt-3 space-y-1.5">
              {(s7.top_cities ?? []).slice(0, 15).map((c, i) => (
                <li
                  key={`${c.city}-${c.region}-${c.country}`}
                  className="flex items-center gap-3 text-sm"
                >
                  <span className="w-5 text-xs font-bold text-[var(--color-muted)]">
                    {i + 1}
                  </span>
                  <span className="text-lg leading-none" aria-hidden>
                    {flagFor(c.country)}
                  </span>
                  <span className="flex-1 truncate">
                    {c.city}
                    {c.region ? (
                      <span className="text-[var(--color-muted)]">
                        , {c.region}
                      </span>
                    ) : null}
                  </span>
                  <span className="font-bold tabular-nums">
                    {fmt(c.views)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      <section className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
          <h3 className="text-base font-bold tracking-tight">
            Top referrers (7d)
          </h3>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            Where they came from — Twitter, Google, Substack, etc. Blank
            = direct visit or hidden referrer.
          </p>
          {(s7.top_referrers ?? []).length === 0 ? (
            <p className="mt-3 text-sm text-[var(--color-muted)] italic">
              No referrer data yet.
            </p>
          ) : (
            <ol className="mt-3 space-y-1.5">
              {(s7.top_referrers ?? []).slice(0, 15).map((r, i) => (
                <li
                  key={r.host}
                  className="flex items-center gap-3 text-sm"
                >
                  <span className="w-5 text-xs font-bold text-[var(--color-muted)]">
                    {i + 1}
                  </span>
                  <span className="flex-1 truncate font-mono">{r.host}</span>
                  <span className="font-bold tabular-nums">
                    {fmt(r.views)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
          <h3 className="text-base font-bold tracking-tight">
            Live visitors right now ({liveList.length})
          </h3>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            One row per session active in the last 5 minutes, current
            page.
          </p>
          {liveList.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--color-muted)] italic">
              No one on the site right now.
            </p>
          ) : (
            <ul className="mt-3 space-y-1.5 max-h-[420px] overflow-y-auto">
              {liveList.map((v) => (
                <li
                  key={v.sid}
                  className="flex items-center gap-2 text-xs"
                >
                  <span className="text-base leading-none" aria-hidden>
                    {flagFor(v.country)}
                  </span>
                  <span className="text-[var(--color-ink-soft)] truncate min-w-[80px]">
                    {v.city ?? "—"}
                    {v.region ? `, ${v.region}` : ""}
                  </span>
                  <span className="flex-1 font-mono truncate">{v.path}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}

async function TopDefendantProfiles() {
  const supabase = await getSupabaseServerClient();
  const [{ data: top7 }, { data: top30 }] = await Promise.all([
    supabase.rpc("analytics_top_defendants", { days: 7 }),
    supabase.rpc("analytics_top_defendants", { days: 30 }),
  ]);

  type Row = {
    slug: string;
    name: string;
    views: number;
    claim_status: string;
  };
  const rows7 = (top7 ?? []) as Row[];
  const rows30 = (top30 ?? []) as Row[];

  if (rows7.length === 0 && rows30.length === 0) return null;

  function render(rows: Row[]) {
    return rows.slice(0, 10).map((r, i) => (
      <li key={r.slug} className="flex items-center gap-3 text-sm">
        <span className="w-5 text-xs font-bold text-[var(--color-muted)]">
          {i + 1}
        </span>
        <Link
          href={`/case/people/${r.slug}`}
          className="flex-1 truncate hover:text-[var(--color-accent)] font-medium"
        >
          {r.name}
          {r.claim_status === "verified" ? (
            <span className="text-[var(--color-success)] ml-1">✓</span>
          ) : null}
        </Link>
        <span className="font-bold tabular-nums">{fmt(r.views)}</span>
      </li>
    ));
  }

  return (
    <section className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
      <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
        <h3 className="text-base font-bold tracking-tight">
          Top J6 profiles — last 7 days
        </h3>
        {rows7.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--color-muted)] italic">
            No defendant-profile views yet this week.
          </p>
        ) : (
          <ol className="mt-3 space-y-1.5">{render(rows7)}</ol>
        )}
      </div>
      <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
        <h3 className="text-base font-bold tracking-tight">
          Top J6 profiles — last 30 days
        </h3>
        {rows30.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--color-muted)] italic">
            No defendant-profile views yet this month.
          </p>
        ) : (
          <ol className="mt-3 space-y-1.5">{render(rows30)}</ol>
        )}
      </div>
    </section>
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
