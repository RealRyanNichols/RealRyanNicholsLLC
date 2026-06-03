import { redirect } from "next/navigation";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { format, formatDistanceToNowStrict, subDays } from "date-fns";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { WorldMap } from "@/components/WorldMap";
import { flagFor, nameFor } from "@/lib/country-coords";
import { normalizeVideoChannel } from "@/lib/video-channels";
import { ReachBySource } from "@/components/ReachBySource";

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

function pctNum(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

function percent(part: number, whole: number): string {
  if (whole <= 0) return "0%";
  return `${Math.round((part / whole) * 100)}%`;
}

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ reach?: string }>;
}) {
  const sp = await searchParams;
  const excludeSelf = sp?.reach === "strict";
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
  const caseViews =
    sumViews(caseGrievances) +
    sumViews(caseEvents) +
    sumViews(caseDocuments) +
    sumViews(casePeople);
  const totalViews = totalPostViews + caseViews;

  const recentComments = recentCommentsRaw ?? [];
  const subsRecent = subsRecentRaw ?? [];

  // Hydrate post titles for recent comments
  const postById = new Map(posts.map((p) => [p.id, p]));

  return (
    <article className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
      <p className="text-xs uppercase tracking-wider text-[var(--color-accent)] font-bold">
        Admin · analytics
      </p>
      <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight">
        Attention dashboard
      </h1>
      <p className="mt-2 text-sm text-[var(--color-ink-soft)] max-w-2xl">
        The glance view: how much attention you&apos;re getting, whether it&apos;s
        growing, what&apos;s working, and where you&apos;re leaking. Everything else
        is tucked into the collapsible sections below.
      </p>

      {/* 0. MAX COMMAND CENTER — live operating read before the scorecards */}
      <CommandCenter />

      {/* 1. ATTENTION SCOREBOARD — above the fold, the few numbers that matter */}
      <Scoreboard />

      {/* 2. 14-DAY TREND — one clear series: daily page views */}
      <TrendBars />

      {/* 3. CONVERSION FUNNEL — reads top to bottom, leaks obvious */}
      <ConversionFunnel />

      {/* 4+. Everything below the scoreboard is secondary and collapsible */}
      <div className="mt-10 border-t border-[var(--color-line)] pt-6">
        <h2 className="text-xs uppercase tracking-wider text-[var(--color-muted)] font-bold">
          The detail · tap any section to open
        </h2>
      </div>

      <CollapsibleSection
        id="post-next"
        title="What to post next"
        summary="Decision cards generated from the funnel — action, hook, thumbnail."
        defaultOpen
      >
        <AttentionFunnel />
      </CollapsibleSection>

      <CollapsibleSection
        id="top-content"
        title="Top content"
        summary="Best posts and videos by views, plus per-channel breakdown."
      >
        <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <RankedList
            title="Top 10 posts by views"
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
            title="Top videos by views"
            rows={videoPosts
              .slice()
              .sort((a, b) => (b.views_count ?? 0) - (a.views_count ?? 0))
              .slice(0, 10)
              .map((p) => ({
                href: `/posts/${p.slug}`,
                label: p.title ?? p.body?.slice(0, 60) ?? "(video)",
                value: p.views_count ?? 0,
                sub: `${normalizeVideoChannel(p.category)} · ${(p.views_count ?? 0).toLocaleString()} views`,
              }))}
            emptyText="No public videos yet."
          />
        </section>
        <section className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          <RankedList
            title="Video channels by views"
            rows={videoChannelRows.map((row) => ({
              href: `/videos#${channelId(row.channel)}`,
              label: row.channel,
              value: row.views,
              sub: `${row.count} video${row.count === 1 ? "" : "s"}`,
            }))}
            emptyText="No public videos yet."
          />
          <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
            <h2 className="text-lg font-bold tracking-tight">Content totals</h2>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Stat label="Posts published" value={fmt(posts.length)} sub={`${fmt(totalPostViews)} post views`} />
              <Stat href="/videos" label="Videos published" value={fmt(videoPosts.length)} sub={`${fmt(videoViews)} video views`} />
              <Stat label="Site-wide views" value={fmt(totalViews)} sub={`${fmt(caseViews)} from the case archive`} />
              <Stat label="Share counter (posts)" value={fmt(totalPostShares + videoShares)} sub="see note below" />
            </div>
            <p className="mt-3 text-xs text-[var(--color-danger)]">
              Note: the posts.shares_count column reads {fmt(totalPostShares)} — it is
              not being written back even though real share events are firing. Use the
              share count in the funnel above (live from page_events), not this column.
            </p>
          </div>
        </section>
      </CollapsibleSection>

      <CollapsibleSection
        id="case-archive"
        title="Case archive attention"
        summary="Top J6 profiles, documents, grievances and timeline events by views."
      >
        <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
      </CollapsibleSection>

      <CollapsibleSection
        id="reach-by-source-wrap"
        title="Reach by source (audit-honest)"
        summary="Every page-load split by human / AI / search / social — the strands chart."
      >
        <ReachBySource excludeSelf={excludeSelf} />
      </CollapsibleSection>

      <CollapsibleSection
        id="live-sessions"
        title="Live sessions (last 24 hours)"
        summary="Active visitors now, top pages with dwell + scroll, click targets, recent sessions."
      >
        <LiveSessions />
      </CollapsibleSection>

      <CollapsibleSection
        id="geography"
        title="Geography — who's reading"
        summary="World map, top countries, cities, referrers, and live visitors right now."
      >
        <Geography />
      </CollapsibleSection>

      <CollapsibleSection
        id="defendant-profiles"
        title="Top J6 defendant profiles (7d / 30d)"
        summary="Which defendant profile pulled the most eyes."
      >
        <TopDefendantProfiles />
      </CollapsibleSection>

      <CollapsibleSection
        id="nexus-attention"
        title="Nexus attention"
        summary="Searches, node clicks, expansions and failed loads from /case/nexus."
      >
        <NexusAttention />
      </CollapsibleSection>

      <CollapsibleSection
        id="tracker-health"
        title="Tracker health"
        summary="First-party collector status, pulled from live page_views and page_events."
      >
        <TrackerHealth />
      </CollapsibleSection>

      <CollapsibleSection
        id="recent-activity"
        title="Recent subscribers & comments"
        summary="The 10 newest signups and approved comments."
      >
        <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div
            id="recent-subscribers"
            className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5"
          >
            <h3 className="text-lg font-bold tracking-tight">Recent subscribers (10 newest)</h3>
            <p className="mt-1 text-xs text-[var(--color-muted)]">
              {fmt(subsTotal)} confirmed · {fmt(subsLast7)} this week · {fmt(subsLast30)} in 30d
            </p>
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
            <h3 className="text-lg font-bold tracking-tight">Recent comments (10 newest)</h3>
            <p className="mt-1 text-xs text-[var(--color-muted)]">
              {fmt(commentsTotal)} approved · {fmt(commentsLast7)} this week
            </p>
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
      </CollapsibleSection>

      {/* Account / queue quick links — kept as a compact footer row */}
      <section className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat href="/case/nexus" label="J6 defendants" value={fmt(j6DefendantsTotal)} sub={`${fmt(j6DefendantsClaimed)} verified`} />
        <Stat href="/admin/claims" label="Pending claims" value={fmt(pendingClaims)} sub={`${fmt(pendingTips)} tip-line items`} />
        <Stat href="/admin/users" label="User accounts" value={fmt(profilesTotal)} sub={`${fmt(profilesPending)} pending review`} />
        <Stat href="/admin/new" label="Post a video" value="New" sub="channel + upload" />
      </section>

      <p className="mt-8 text-xs text-[var(--color-muted)]">
        Snapshot taken {format(now, "MMM d, yyyy h:mma")} ·{" "}
        <Link href="/admin/users" className="underline">User moderation</Link> ·{" "}
        <Link href="/admin/new" className="underline">New post</Link> ·{" "}
        <Link href="/admin/case" className="underline">Upload case document</Link>
      </p>
      <p className="mt-2 text-xs text-[var(--color-muted)] max-w-2xl">
        Country / region / city come from Vercel&apos;s free request headers; no IPs
        are stored. Visitor counts use a daily-rotating one-way hash.
      </p>
    </article>
  );
}

function channelId(channel: string): string {
  return channel.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// ---------------------------------------------------------------------------
// 0. MAX COMMAND CENTER
// ---------------------------------------------------------------------------

type CommandViewRow = {
  path: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  referrer_host: string | null;
  device_kind: string | null;
  started_at: string;
  last_activity_at: string;
  scroll_max: number | null;
};

type CommandEventRow = {
  kind: string | null;
  target: string | null;
  path: string | null;
};

function topEntry(rows: Array<string | null | undefined>): { label: string; n: number } | null {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const key = row?.trim();
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const [label, n] = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0] ?? [];
  return label ? { label, n } : null;
}

function countCommandKinds(rows: CommandEventRow[], kinds: string[]): number {
  const wanted = new Set(kinds);
  return rows.reduce((sum, row) => sum + (row.kind && wanted.has(row.kind) ? 1 : 0), 0);
}

function commandTone(value: number, goodAt: number, watchAt: number): Tone {
  if (value >= goodAt) return "healthy";
  if (value >= watchAt) return "watch";
  return "leak";
}

async function CommandCenter() {
  const supabase = await getSupabaseServerClient();
  const now = new Date();
  const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
  const sevenDaysAgo = subDays(now, 7).toISOString();
  const thirtyDaysAgo = subDays(now, 30).toISOString();

  const [
    { count: liveNow },
    { count: views7 },
    { count: views30 },
    { count: events7 },
    { data: liveRowsRaw },
    { data: views7Raw },
    { data: events7Raw },
  ] = await Promise.all([
    supabase
      .from("page_views")
      .select("id", { count: "exact", head: true })
      .gte("last_activity_at", fiveMinAgo),
    supabase
      .from("page_views")
      .select("id", { count: "exact", head: true })
      .gte("started_at", sevenDaysAgo),
    supabase
      .from("page_views")
      .select("id", { count: "exact", head: true })
      .gte("started_at", thirtyDaysAgo),
    supabase
      .from("page_events")
      .select("id", { count: "exact", head: true })
      .gte("at", sevenDaysAgo),
    supabase
      .from("page_views")
      .select("path, country, region, city, referrer_host, device_kind, started_at, last_activity_at, scroll_max")
      .gte("last_activity_at", fiveMinAgo)
      .order("last_activity_at", { ascending: false })
      .limit(50),
    supabase
      .from("page_views")
      .select("path, country, region, city, referrer_host, device_kind, started_at, last_activity_at, scroll_max")
      .gte("started_at", sevenDaysAgo)
      .order("started_at", { ascending: false })
      .limit(5000),
    supabase
      .from("page_events")
      .select("kind, target, path")
      .gte("at", sevenDaysAgo)
      .order("at", { ascending: false })
      .limit(5000),
  ]);

  const liveRows = (liveRowsRaw ?? []) as CommandViewRow[];
  const viewRows = (views7Raw ?? []) as CommandViewRow[];
  const eventRows = (events7Raw ?? []) as CommandEventRow[];
  const viewSampleCount = viewRows.length;
  const usViews = viewRows.filter((row) => row.country?.toUpperCase() === "US").length;
  const mobileViews = viewRows.filter((row) => row.device_kind === "mobile").length;
  const scrollRows = viewRows.filter((row) => typeof row.scroll_max === "number");
  const avgScroll =
    scrollRows.length > 0
      ? Math.round(scrollRows.reduce((sum, row) => sum + (row.scroll_max ?? 0), 0) / scrollRows.length)
      : 0;
  const topPath = topEntry(viewRows.map((row) => row.path));
  const topReferrer = topEntry(viewRows.map((row) => row.referrer_host));
  const topCity = topEntry(
    viewRows.map((row) =>
      row.city
        ? `${row.city}${row.region ? `, ${row.region}` : ""}${row.country ? ` · ${row.country}` : ""}`
        : row.country,
    ),
  );
  const livePath = topEntry(liveRows.map((row) => row.path));

  const shares = countCommandKinds(eventRows, ["share_platform", "share_native", "share_copy"]);
  const shareMenus = countCommandKinds(eventRows, ["share_menu_open"]);
  const subscribeAttempts = countCommandKinds(eventRows, ["subscribe_attempt", "follow_capture_attempt"]);
  const subscribeWins = countCommandKinds(eventRows, ["subscribe_success", "follow_capture_success"]);
  const tipAttempts = countCommandKinds(eventRows, ["tip_submit_attempt"]);
  const tipWins = countCommandKinds(eventRows, ["tip_submit_success"]);
  const supportStarts = countCommandKinds(eventRows, ["support_intent_attempt"]);
  const supportSaved = countCommandKinds(eventRows, ["support_intent_saved"]);
  const donateClicks = countCommandKinds(eventRows, ["donate_click", "support_checkout_open"]);

  const usPct = pctNum(usViews, viewSampleCount);
  const mobilePct = pctNum(mobileViews, viewSampleCount);
  const sharePct = pctNum(shares, shareMenus);
  const subscribePct = pctNum(subscribeWins, subscribeAttempts);
  const tipPct = pctNum(tipWins, tipAttempts);
  const supportPct = pctNum(supportSaved, supportStarts);

  const actionQueue = [
    {
      label: "Return path",
      value: subscribePct,
      text:
        subscribeAttempts === 0
          ? "No signup attempts in the sampled 7d stream. Push alerts harder on live/video pages."
          : `${subscribePct}% signup conversion. ${fmt(subscribeWins)} wins from ${fmt(subscribeAttempts)} attempts.`,
      href: "#recent-subscribers",
    },
    {
      label: "Tip intake",
      value: tipPct,
      text:
        tipAttempts === 0
          ? "No tip starts in the sampled 7d stream. Move the tip lane higher on story pages."
          : `${tipPct}% tip completion. ${fmt(tipWins)} submitted from ${fmt(tipAttempts)} starts.`,
      href: "/admin/tips",
    },
    {
      label: "Money path",
      value: supportPct,
      text:
        supportStarts === 0
          ? "No support-intent starts in the sampled 7d stream. Make funding asks more concrete."
          : `${supportPct}% support save rate. ${fmt(donateClicks)} donation/checkout clicks.`,
      href: "/support#support-mission",
    },
    {
      label: "Distribution",
      value: sharePct,
      text:
        shareMenus === 0
          ? "No share menus opened in the sampled 7d stream. Add one receipt people can repost."
          : `${sharePct}% share completion. ${fmt(shares)} shares from ${fmt(shareMenus)} opened menus.`,
      href: "#top-content",
    },
  ].sort((a, b) => a.value - b.value);

  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-[#243452] bg-[#0b1428] text-[#fdf8ea]">
      <div className="border-b border-white/10 px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#7fe3a9]">
              Max analytics command center
            </p>
            <h2 className="mt-1 text-xl font-black tracking-tight">
              Who is here, what they want, and where the leaks are.
            </h2>
          </div>
          <Link
            href="/the-map-room"
            className="rounded-full border border-[#7fe3a9]/40 bg-[#7fe3a9]/10 px-4 py-2 text-xs font-black uppercase tracking-wider text-[#7fe3a9] transition hover:bg-[#7fe3a9] hover:text-[#0b1428]"
          >
            Open live radar
          </Link>
        </div>
      </div>

      <div className="grid gap-px bg-white/10 md:grid-cols-4">
        <CommandMetric
          label="Live pulse"
          value={fmt(liveNow)}
          sub={livePath ? `Hot now: ${livePath.label}` : "No active path yet"}
          tone={(liveNow ?? 0) > 0 ? "healthy" : "neutral"}
        />
        <CommandMetric
          label="U.S. center"
          value={`${usPct}%`}
          sub={`${fmt(usViews)} of ${fmt(viewSampleCount)} sampled views · ${topCity?.label ?? "geo pending"}`}
          tone={commandTone(usPct, 70, 45)}
        />
        <CommandMetric
          label="Mobile weight"
          value={`${mobilePct}%`}
          sub={`${fmt(mobileViews)} mobile views · average scroll ${avgScroll}%`}
          tone={commandTone(mobilePct, 60, 40)}
        />
        <CommandMetric
          label="7d / 30d views"
          value={`${fmt(views7)} / ${fmt(views30)}`}
          sub={`${fmt(events7)} events · ${topReferrer?.label ?? "direct / unknown"} leads referrals`}
          tone="neutral"
        />
      </div>

      <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#d8c89e]">
                Hottest path
              </p>
              <h3 className="mt-1 break-all font-mono text-sm font-black text-[#fdf8ea]">
                {topPath?.label ?? "No path data yet"}
              </h3>
            </div>
            <span className="rounded-full bg-[#7fe3a9] px-3 py-1 text-xs font-black text-[#0b1428]">
              {fmt(topPath?.n ?? 0)} views
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-[#cfd9ea]">
            Use the hottest path as the next post prompt. If people are already
            opening it, publish a follow-up that sends them back there, asks one
            clear question, and turns the page into a share target.
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#d8c89e]">
            Fix first
          </p>
          <div className="mt-3 grid gap-2">
            {actionQueue.slice(0, 3).map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="block rounded-lg border border-white/10 bg-[#101a31] p-3 transition hover:border-[#7fe3a9]"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-black">{item.label}</span>
                  <span className="font-mono text-xs font-black text-[#7fe3a9]">
                    {item.value}%
                  </span>
                </div>
                <p className="mt-1 text-xs leading-snug text-[#cfd9ea]">
                  {item.text}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <p className="border-t border-white/10 px-4 py-3 text-xs text-[#a9b7d0] sm:px-5">
        Max mode uses the first-party stream already collected here: page views,
        dwell, scroll, clicks, outbound clicks, acquisition, shares, tips,
        support intent, subscriptions, video and live events. No IPs are shown.
      </p>
    </section>
  );
}

function CommandMetric({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone: Tone;
}) {
  const styles = TONE_STYLES[tone];
  return (
    <div className="bg-[#0b1428] p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#a9b7d0]">
          {label}
        </span>
        <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${styles.chip}`}>
          {tone === "healthy" ? "strong" : tone === "watch" ? "watch" : tone === "leak" ? "fix" : "read"}
        </span>
      </div>
      <div className={`mt-2 text-3xl font-black tracking-tight tabular-nums ${tone === "neutral" ? "text-[#fdf8ea]" : styles.value}`}>
        {value}
      </div>
      <p className="mt-1 text-xs leading-snug text-[#cfd9ea]">{sub}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 1. ATTENTION SCOREBOARD
// ---------------------------------------------------------------------------

type Tone = "healthy" | "watch" | "leak" | "neutral";

const TONE_STYLES: Record<Tone, { value: string; chip: string }> = {
  healthy: {
    value: "text-[var(--color-success)]",
    chip: "bg-[var(--color-success)]/15 text-[var(--color-success)]",
  },
  watch: {
    value: "text-[#b45309]",
    chip: "bg-[#b45309]/15 text-[#b45309]",
  },
  leak: {
    value: "text-[var(--color-danger)]",
    chip: "bg-[var(--color-danger)]/15 text-[var(--color-danger)]",
  },
  neutral: {
    value: "text-[var(--color-ink)]",
    chip: "bg-[var(--color-surface-2)] text-[var(--color-muted)]",
  },
};

function ScoreTile({
  href,
  label,
  value,
  tone,
  note,
  trend,
}: {
  href: string;
  label: string;
  value: string;
  tone: Tone;
  note: string;
  trend?: { dir: "up" | "down" | "flat"; text: string };
}) {
  const styles = TONE_STYLES[tone];
  const arrow = trend ? (trend.dir === "up" ? "▲" : trend.dir === "down" ? "▼" : "→") : null;
  const arrowColor =
    trend?.dir === "up"
      ? "text-[var(--color-success)]"
      : trend?.dir === "down"
      ? "text-[var(--color-danger)]"
      : "text-[var(--color-muted)]";
  return (
    <Link
      href={href}
      className="flex flex-col rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 transition hover:border-[var(--color-accent)] hover:-translate-y-0.5"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] uppercase tracking-wider text-[var(--color-muted)] font-semibold">
          {label}
        </span>
        <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${styles.chip}`}>
          {tone === "healthy" ? "good" : tone === "watch" ? "watch" : tone === "leak" ? "leak" : "—"}
        </span>
      </div>
      <div className={`mt-1 text-3xl sm:text-4xl font-bold tracking-tight tabular-nums leading-none ${styles.value}`}>
        {value}
      </div>
      {trend ? (
        <div className={`mt-1.5 text-xs font-semibold ${arrowColor}`}>
          {arrow} {trend.text}
        </div>
      ) : null}
      <div className="mt-1.5 text-xs text-[var(--color-ink-soft)] leading-snug">{note}</div>
    </Link>
  );
}

async function Scoreboard() {
  const supabase = await getSupabaseServerClient();
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const day1 = subDays(new Date(), 1).toISOString();
  const day2 = subDays(new Date(), 2).toISOString();
  const day7 = subDays(new Date(), 7).toISOString();
  const day14 = subDays(new Date(), 14).toISOString();

  // Count by kind with head+exact so PostgREST's 1000-row cap can never
  // undercount (these event classes already exceed 1000 rows in 7d).
  const eventCount = (kinds: string[]) =>
    supabase
      .from("page_events")
      .select("id", { count: "exact", head: true })
      .gte("at", day7)
      .in("kind", kinds);

  const [
    { count: liveNow },
    { count: views24 },
    { count: viewsPrev24 },
    { count: views7 },
    { count: viewsPrev7 },
    { count: vPlay },
    { count: vDone },
    { count: capAttempt },
    { count: capSuccess },
  ] = await Promise.all([
    supabase
      .from("page_views")
      .select("session_id", { count: "exact", head: true })
      .gte("last_activity_at", fiveMinAgo),
    supabase
      .from("page_views")
      .select("id", { count: "exact", head: true })
      .gte("started_at", day1),
    supabase
      .from("page_views")
      .select("id", { count: "exact", head: true })
      .gte("started_at", day2)
      .lt("started_at", day1),
    supabase
      .from("page_views")
      .select("id", { count: "exact", head: true })
      .gte("started_at", day7),
    supabase
      .from("page_views")
      .select("id", { count: "exact", head: true })
      .gte("started_at", day14)
      .lt("started_at", day7),
    eventCount(["video_play"]),
    eventCount(["video_complete"]),
    eventCount(["subscribe_attempt", "follow_capture_attempt"]),
    eventCount(["subscribe_success", "follow_capture_success"]),
  ]);

  const v24 = views24 ?? 0;
  const vp24 = viewsPrev24 ?? 0;
  const v7 = views7 ?? 0;
  const vp7 = viewsPrev7 ?? 0;
  const dir = (a: number, b: number): { dir: "up" | "down" | "flat"; text: string } => {
    if (b <= 0) return { dir: "flat", text: "no prior data" };
    const change = Math.round(((a - b) / b) * 100);
    if (change > 1) return { dir: "up", text: `+${change}% vs prior` };
    if (change < -1) return { dir: "down", text: `${change}% vs prior` };
    return { dir: "flat", text: "flat vs prior" };
  };

  const vPlayN = vPlay ?? 0;
  const vDoneN = vDone ?? 0;
  const capAttemptN = capAttempt ?? 0;
  const capSuccessN = capSuccess ?? 0;
  const videoPct = pctNum(vDoneN, vPlayN);
  const capPct = pctNum(capSuccessN, capAttemptN);
  const videoTone: Tone = videoPct >= 50 ? "healthy" : videoPct >= 30 ? "watch" : "leak";
  const capTone: Tone = capPct >= 45 ? "healthy" : capPct >= 20 ? "watch" : "leak";

  // One-line plain-language read of the dashboard.
  const growing = v7 >= vp7;
  const meaning =
    `You pulled ${v24.toLocaleString()} views in the last 24h and ${v7.toLocaleString()} this week — ` +
    `attention is ${growing ? "growing" : "down"} vs the prior period. ` +
    `Video is the strength (${videoPct}% of plays finish). ` +
    `Email capture is the leak (${capPct}% of signup attempts succeed) — fix the signup flow.`;

  return (
    <section id="scoreboard" className="mt-8">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <ScoreTile
          href="#live-sessions"
          label="Live now"
          value={String(liveNow ?? 0)}
          tone={(liveNow ?? 0) > 0 ? "healthy" : "neutral"}
          note="Active in the last 5 minutes."
        />
        <ScoreTile
          href="#trend"
          label="Views · 24h"
          value={fmt(v24)}
          tone="neutral"
          trend={dir(v24, vp24)}
          note={`${vp24.toLocaleString()} the day before.`}
        />
        <ScoreTile
          href="#trend"
          label="Views · 7d"
          value={fmt(v7)}
          tone="neutral"
          trend={dir(v7, vp7)}
          note={`${vp7.toLocaleString()} the prior 7 days.`}
        />
        <ScoreTile
          href="#funnel"
          label="Video completion"
          value={`${videoPct}%`}
          tone={videoTone}
          note={`${fmt(vDoneN)} of ${fmt(vPlayN)} plays finished (7d).`}
        />
        <ScoreTile
          href="#funnel"
          label="Email capture"
          value={`${capPct}%`}
          tone={capTone}
          note={`${fmt(capSuccessN)} of ${fmt(capAttemptN)} signup attempts won (7d).`}
        />
      </div>
      <p className="mt-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-ink-soft)]">
        <span className="font-bold text-[var(--color-ink)]">What this means: </span>
        {meaning}
      </p>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 2. 14-DAY TREND (single clear series, server-rendered bars)
// ---------------------------------------------------------------------------

async function TrendBars() {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase.rpc("analytics_daily_views", { p_days: 14 });
  const rows = (Array.isArray(data) ? data : []) as { day: string; views: number }[];
  const max = rows.reduce((m, r) => Math.max(m, r.views ?? 0), 0);
  const total = rows.reduce((s, r) => s + (r.views ?? 0), 0);
  const peak = rows.reduce(
    (best, r) => ((r.views ?? 0) > best.views ? { day: r.day, views: r.views ?? 0 } : best),
    { day: "", views: 0 },
  );

  return (
    <section
      id="trend"
      className="mt-6 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 scroll-mt-20"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Daily page views — last 14 days</h2>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            One bar per day (America/Chicago). Each bar is total page views that day —
            humans and bots. {total.toLocaleString()} views over 14 days
            {peak.views > 0
              ? `, peaking at ${peak.views.toLocaleString()} on ${format(new Date(`${peak.day}T12:00:00`), "MMM d")}`
              : ""}
            .
          </p>
        </div>
        <span className="rounded-full bg-[var(--color-accent-soft)] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-accent)]">
          Page views
        </span>
      </div>

      {rows.length === 0 || max === 0 ? (
        <p className="mt-4 text-sm text-[var(--color-muted)] italic">
          No page views recorded in the last 14 days yet.
        </p>
      ) : (
        <div className="mt-5 flex items-end gap-1.5 sm:gap-2 h-44">
          {rows.map((r) => {
            const h = max > 0 ? Math.max(2, Math.round((r.views / max) * 100)) : 0;
            const d = new Date(`${r.day}T12:00:00`);
            return (
              <div key={r.day} className="flex-1 flex flex-col items-center justify-end h-full min-w-0">
                <span className="mb-1 text-[9px] sm:text-[10px] font-bold tabular-nums text-[var(--color-ink-soft)]">
                  {r.views >= 1000 ? fmt(r.views) : r.views}
                </span>
                <div
                  className="w-full rounded-t bg-[var(--color-accent)] transition-all"
                  style={{ height: `${h}%` }}
                  title={`${format(d, "EEE MMM d")}: ${r.views.toLocaleString()} views`}
                />
                <span className="mt-1 text-[9px] sm:text-[10px] tabular-nums text-[var(--color-muted)] whitespace-nowrap">
                  {format(d, "M/d")}
                </span>
              </div>
            );
          })}
        </div>
      )}
      <p className="mt-3 text-xs text-[var(--color-muted)]">
        Today&apos;s bar is partial — it only counts views so far. Tracking began
        May 20, 2026, so days before that read zero.
      </p>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 3. CONVERSION FUNNEL
// ---------------------------------------------------------------------------

type FunnelStep = {
  label: string;
  value: number;
  href: string;
  hint: string;
};

function FunnelRow({
  step,
  prev,
  max,
  index,
}: {
  step: FunnelStep;
  prev: number | null;
  max: number;
  index: number;
}) {
  const widthPct = max > 0 ? Math.max(2, Math.round((step.value / max) * 100)) : 0;
  const stepPct = prev === null ? null : pctNum(step.value, prev);
  // Color the step-to-step conversion: a big drop is the leak signal.
  let dropTone = "text-[var(--color-muted)]";
  if (stepPct !== null) {
    if (stepPct >= 60) dropTone = "text-[var(--color-success)]";
    else if (stepPct >= 25) dropTone = "text-[#b45309]";
    else dropTone = "text-[var(--color-danger)]";
  }
  return (
    <div className="flex items-center gap-3">
      <span className="w-4 text-xs font-bold text-[var(--color-muted)] tabular-nums">{index + 1}</span>
      <div className="flex-1 min-w-0">
        <Link href={step.href} className="block group">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold truncate group-hover:text-[var(--color-accent)]">
              {step.label}
            </span>
            <span className="text-sm font-bold tabular-nums">{step.value.toLocaleString()}</span>
          </div>
          <div className="mt-1 h-3 w-full rounded-full bg-[var(--color-surface-2)] overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--color-accent)]"
              style={{ width: `${widthPct}%` }}
            />
          </div>
        </Link>
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="text-[11px] text-[var(--color-muted)]">{step.hint}</span>
          {stepPct !== null ? (
            <span className={`text-[11px] font-bold tabular-nums ${dropTone}`}>
              {stepPct}% of prior step
            </span>
          ) : (
            <span className="text-[11px] font-bold text-[var(--color-muted)]">top of funnel</span>
          )}
        </div>
      </div>
    </div>
  );
}

async function ConversionFunnel() {
  const supabase = await getSupabaseServerClient();
  const day7 = subDays(new Date(), 7).toISOString();

  // Per-kind counts via head+exact so the 1000-row PostgREST cap can never
  // undercount (scroll/video events alone exceed 1000 rows in 7d).
  const eventCount = (kinds: string[]) =>
    supabase
      .from("page_events")
      .select("id", { count: "exact", head: true })
      .gte("at", day7)
      .in("kind", kinds);

  const [
    { count: views7 },
    { count: scroll50 },
    { count: vPlay },
    { count: vDone },
    { count: sharesDone },
    { count: shareMenus },
    { count: reactComment },
    { count: subscribe },
    { count: donate },
  ] = await Promise.all([
    supabase
      .from("page_views")
      .select("id", { count: "exact", head: true })
      .gte("started_at", day7),
    eventCount(["scroll_50"]),
    eventCount(["video_play"]),
    eventCount(["video_complete"]),
    eventCount(["share_platform", "share_native", "share_copy"]),
    eventCount(["share_menu_open"]),
    eventCount(["reaction_toggle", "comment_submit_success", "case_comment_submit_success"]),
    eventCount(["subscribe_success", "follow_capture_success"]),
    eventCount(["donate_click"]),
  ]);

  const steps: FunnelStep[] = [
    { label: "Views", value: views7 ?? 0, href: "#trend", hint: "page loads (7d)" },
    { label: "Scroll 50%", value: scroll50 ?? 0, href: "#live-sessions", hint: "read past the halfway mark" },
    { label: "Video play", value: vPlay ?? 0, href: "#top-content", hint: "pressed play on a video" },
    { label: "Video complete", value: vDone ?? 0, href: "#top-content", hint: "watched to the end — your strength" },
    { label: "Share", value: sharesDone ?? 0, href: "#top-content", hint: `${shareMenus ?? 0} share menus opened` },
    { label: "React / Comment", value: reactComment ?? 0, href: "#recent-activity", hint: "public proof taps" },
    { label: "Subscribe", value: subscribe ?? 0, href: "#recent-activity", hint: "joined the alert list — leaking" },
    { label: "Donate click", value: donate ?? 0, href: "/support", hint: "tapped to give" },
  ];
  const max = steps.reduce((m, s) => Math.max(m, s.value), 0);

  return (
    <section
      id="funnel"
      className="mt-6 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 scroll-mt-20"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Conversion funnel — last 7 days</h2>
          <p className="mt-1 text-xs text-[var(--color-muted)] max-w-xl">
            The public path, top to bottom. The bar is each step&apos;s size; the
            percentage is that step versus the one above it, so a big drop is an
            obvious leak.
          </p>
        </div>
        <span className="rounded-full bg-[var(--color-accent-soft)] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-accent)]">
          Last 7 days
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {steps.map((step, i) => (
          <FunnelRow
            key={step.label}
            step={step}
            prev={i === 0 ? null : steps[i - 1].value}
            max={max}
            index={i}
          />
        ))}
      </div>

      <p className="mt-4 text-xs text-[var(--color-muted)]">
        Steps are independent event counts (not a strict per-visitor cohort), so
        treat the percentages as direction, not a single funneling crowd. Share
        figures here are live share <em>events</em> from page_events — the
        posts.shares_count column is not being written and should be ignored.
      </p>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Collapsible shell for the secondary detail sections
// ---------------------------------------------------------------------------

function CollapsibleSection({
  id,
  title,
  summary,
  defaultOpen = false,
  children,
}: {
  id: string;
  title: string;
  summary: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details
      id={id}
      open={defaultOpen}
      className="group mt-4 rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper)] scroll-mt-20"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-bold tracking-tight">{title}</h2>
          <p className="mt-0.5 text-xs text-[var(--color-muted)] truncate">{summary}</p>
        </div>
        <span
          className="shrink-0 text-[var(--color-muted)] transition-transform group-open:rotate-180"
          aria-hidden
        >
          ▾
        </span>
      </summary>
      <div className="px-5 pb-5 pt-1">{children}</div>
    </details>
  );
}

// ---------------------------------------------------------------------------
// Shared presentational helper
// ---------------------------------------------------------------------------

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
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-[var(--color-muted)]">
          First-party collector status, pulled from live page_views and page_events.
        </p>
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
    </div>
  );
}

type EventRow = {
  kind: string | null;
  target: string | null;
  path: string | null;
  at: string;
};

type ViewPathRow = {
  path: string | null;
};

function countKinds(rows: EventRow[], kinds: string[]): number {
  const wanted = new Set(kinds);
  return rows.reduce((sum, row) => sum + (row.kind && wanted.has(row.kind) ? 1 : 0), 0);
}

type PostNextCard = {
  label: string;
  priority: string;
  href: string;
  reason: string;
  action: string;
  hook: string;
  thumbnail: string;
  metric: string;
};

function firstMatchingPath(
  rows: { path: string; views: number }[],
  prefix: string,
): { path: string; views: number } | null {
  return rows.find((row) => row.path.startsWith(prefix)) ?? null;
}

function buildPostNextCards(opts: {
  views7: number;
  shares7: number;
  shareOpens7: number;
  commentStarts7: number;
  commentSends7: number;
  supportStarts7: number;
  supportSaved7: number;
  subscribeAttempts7: number;
  subscribeWins7: number;
  videoPlays7: number;
  videoHalf7: number;
  livePlays7: number;
  topPath: { path: string; views: number } | null;
  topPostPath: { path: string; views: number } | null;
  topCasePath: { path: string; views: number } | null;
}): PostNextCard[] {
  const cards: PostNextCard[] = [];
  const shareRate = opts.shareOpens7 > 0 ? opts.shares7 / opts.shareOpens7 : 0;
  const commentRate =
    opts.commentStarts7 > 0 ? opts.commentSends7 / opts.commentStarts7 : 0;
  const supportRate =
    opts.supportStarts7 > 0 ? opts.supportSaved7 / opts.supportStarts7 : 0;
  const subscribeRate =
    opts.subscribeAttempts7 > 0
      ? opts.subscribeWins7 / opts.subscribeAttempts7
      : 0;
  const retentionRate =
    opts.videoPlays7 > 0 ? opts.videoHalf7 / opts.videoPlays7 : 0;

  if (opts.videoPlays7 === 0 || retentionRate < 0.35) {
    cards.push({
      label: "Post a short owned video",
      priority: "Highest leverage",
      href: "/admin/new",
      reason:
        opts.videoPlays7 === 0
          ? "No video plays in the funnel yet. The site needs a fresh watchable asset."
          : `Only ${percent(opts.videoHalf7, opts.videoPlays7)} of video plays hit halfway.`,
      action:
        "Record a 60-120 second direct-to-camera update. One claim, one receipt, one question for the comments.",
      hook: "They took me off the platforms. So I built the room where the record lives.",
      thumbnail: "Ryan at desk, evidence map behind him, bold text: COME TO THE SOURCE",
      metric: `${fmt(opts.videoPlays7)} plays · ${fmt(opts.videoHalf7)} halfway`,
    });
  }

  if (opts.livePlays7 === 0) {
    cards.push({
      label: "Schedule the next live room",
      priority: "Audience habit",
      href: "/admin/live",
      reason:
        "No live plays in the last seven days. A recurring live window trains people to come back.",
      action:
        "Create a live room for tonight, announce it, and use the same title format every day.",
      hook: "Tonight: building the case in public, answering comments, and showing the next record.",
      thumbnail: "Live console look, red LIVE mark, text: TONIGHT ON REALRYANNICHOLS.COM",
      metric: `${fmt(opts.livePlays7)} live/replay plays`,
    });
  }

  if (shareRate < 0.4 && opts.views7 > 0) {
    cards.push({
      label: "Post a shareable receipt",
      priority: "Distribution",
      href: "/admin/new",
      reason: `Share conversion is ${percent(opts.shares7, opts.shareOpens7)} from the funnel.`,
      action:
        "Publish one screenshot/document/timeline point with a plain question people can repost.",
      hook:
        "Before you argue about January 6, look at this document and tell me what you see.",
      thumbnail: "Document close-up, highlighted date, text: READ THE RECORD",
      metric: `${fmt(opts.shareOpens7)} share menus · ${fmt(opts.shares7)} completions`,
    });
  }

  if (commentRate < 0.5) {
    cards.push({
      label: "Ask a comment-first question",
      priority: "Public proof",
      href: opts.topPostPath?.path ?? "/admin/new",
      reason: `Public conversation is converting at ${percent(opts.commentSends7, opts.commentStarts7)}.`,
      action:
        "End the next post with one specific question. Do not ask for general thoughts.",
      hook: "What is the one piece of evidence you want me to explain on the next live?",
      thumbnail: "Comment thread screenshot style, text: ANSWER THIS",
      metric: `${fmt(opts.commentStarts7)} starts · ${fmt(opts.commentSends7)} comments`,
    });
  }

  if (supportRate < 0.35) {
    cards.push({
      label: "Post a transparent support update",
      priority: "Money path",
      href: "/support#support-mission",
      reason: `Support intent save rate is ${percent(opts.supportSaved7, opts.supportStarts7)}.`,
      action:
        "Show exactly what money is needed for and what happens if more comes in than needed.",
      hook:
        "I do not want more than I need. Here is what support pays for, and where extra goes.",
      thumbnail: "Simple ledger board, three columns: NEED, RECEIVED, GIVE BACK",
      metric: `${fmt(opts.supportStarts7)} starts · ${fmt(opts.supportSaved7)} saved`,
    });
  }

  if (subscribeRate < 0.45) {
    cards.push({
      label: "Post a go-live signup push",
      priority: "Return traffic",
      href: "/live",
      reason: `Subscriber capture is ${percent(opts.subscribeWins7, opts.subscribeAttempts7)}.`,
      action:
        "Make one post whose only job is getting people onto email/SMS for live alerts.",
      hook:
        "If they shut down the feed, the alert list is how you know when I go live.",
      thumbnail: "Phone notification mockup, text: RYAN IS LIVE",
      metric: `${fmt(opts.subscribeAttempts7)} attempts · ${fmt(opts.subscribeWins7)} captured`,
    });
  }

  const hotPath = opts.topCasePath ?? opts.topPostPath ?? opts.topPath;
  if (hotPath) {
    cards.push({
      label: "Follow the hottest page",
      priority: "Momentum",
      href: hotPath.path,
      reason: `${hotPath.path} is pulling the most attention in the last seven days.`,
      action:
        "Post a follow-up that sends people back to that exact page and asks them to share one finding.",
      hook: "This is the page people keep opening. Here is the part they cannot ignore.",
      thumbnail: "Analytics/map-room look, text: WHY THIS PAGE IS MOVING",
      metric: `${fmt(hotPath.views)} views`,
    });
  }

  return cards.slice(0, 5);
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
    { data: views7Raw },
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
    supabase
      .from("page_views")
      .select("path")
      .gte("started_at", sevenDaysAgo)
      .limit(5000),
  ]);

  const events24 = (events24Raw ?? []) as EventRow[];
  const events7 = (events7Raw ?? []) as EventRow[];
  const pathCounts = new Map<string, number>();
  for (const view of (views7Raw ?? []) as ViewPathRow[]) {
    if (!view.path) continue;
    pathCounts.set(view.path, (pathCounts.get(view.path) ?? 0) + 1);
  }
  const topPaths = Array.from(pathCounts.entries())
    .map(([path, views]) => ({ path, views }))
    .sort((a, b) => b.views - a.views);
  const topPath = topPaths[0] ?? null;
  const topPostPath = firstMatchingPath(topPaths, "/posts/");
  const topCasePath = firstMatchingPath(topPaths, "/case/");

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
  const postNextCards = buildPostNextCards({
    views7: views7 ?? 0,
    shares7,
    shareOpens7,
    commentStarts7,
    commentSends7,
    supportStarts7,
    supportSaved7,
    subscribeAttempts7,
    subscribeWins7,
    videoPlays7,
    videoHalf7,
    livePlays7,
    topPath,
    topPostPath,
    topCasePath,
  });

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Views (24h)" value={fmt(views24)} sub={`${fmt(events24.length)} events`} />
        <Stat label="Views (7d)" value={fmt(views7)} sub={`${fmt(events7.length)} events`} />
        <Stat label="Shares (7d)" value={fmt(shares7)} sub={`${fmt(shareOpens7)} menus opened`} />
        <Stat label="Public actions" value={fmt(commentSends7 + reactions7)} sub="comments + reactions" />
      </div>

      <div className="mt-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-base font-bold tracking-tight">What to post next</h3>
            <p className="mt-1 text-xs text-[var(--color-muted)]">
              Decision cards generated from the funnel. Each one has the action, hook, and thumbnail brief.
            </p>
          </div>
          <Link
            href="/admin/new"
            className="rounded-full bg-[var(--color-accent)] px-4 py-2 text-xs font-black text-[var(--color-paper)]"
          >
            Create post
          </Link>
        </div>
        <div className="mt-3 grid gap-3">
          {postNextCards.map((card, index) => (
            <Link
              key={`${card.label}-${index}`}
              href={card.href}
              className="block rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 transition hover:border-[var(--color-accent)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-[var(--color-accent)]">
                    {index + 1}. {card.priority}
                  </p>
                  <h4 className="mt-1 text-lg font-black tracking-tight">{card.label}</h4>
                </div>
                <span className="rounded-full bg-[var(--color-paper)] px-3 py-1 text-xs font-mono font-bold text-[var(--color-ink-soft)]">
                  {card.metric}
                </span>
              </div>
              <p className="mt-2 text-sm text-[var(--color-ink-soft)]">{card.reason}</p>
              <p className="mt-3 text-sm font-semibold text-[var(--color-ink)]">
                Do next: {card.action}
              </p>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                <p className="rounded-lg bg-[var(--color-paper)] p-3 text-xs leading-relaxed">
                  <span className="font-black uppercase tracking-wider text-[var(--color-muted)]">
                    Hook
                  </span>
                  <br />
                  {card.hook}
                </p>
                <p className="rounded-lg bg-[var(--color-paper)] p-3 text-xs leading-relaxed">
                  <span className="font-black uppercase tracking-wider text-[var(--color-muted)]">
                    Thumbnail
                  </span>
                  <br />
                  {card.thumbnail}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <h3 className="text-base font-bold tracking-tight">Conversion checkpoints</h3>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {attentionActions.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="block rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-3 transition hover:border-[var(--color-accent)]"
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
    </div>
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
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="text-xs text-[var(--color-muted)]">
          Searches, node clicks, expansions, and failed loads from /case/nexus.
        </p>
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
    </div>
  );
}

async function LiveSessions() {
  const supabase = await getSupabaseServerClient();
  const fiveMinAgo = subDays(new Date(), 0);
  fiveMinAgo.setMinutes(fiveMinAgo.getMinutes() - 5);
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
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Active now" value={String(activeNow ?? 0)} sub="last 5 min" />
        <Stat label="Page views (24h)" value={String(views24h?.length ?? 0)} />
        <Stat label="Sessions (24h)" value={String(sessions24h ?? 0)} sub="unique" />
        <Stat label="Avg dwell" value={`${avgDwellSec}s`} sub="per page view" />
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
          <h3 className="text-base font-bold tracking-tight">
            Top pages — views, dwell, scroll
          </h3>
          {topPaths.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--color-muted)] italic">
              No traffic yet in the last 24h.
            </p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm min-w-[360px]">
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
            </div>
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
      </div>

      <section className="mt-6 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
        <h3 className="text-base font-bold tracking-tight">
          Recent sessions ({(recentSessions ?? []).length})
        </h3>
        {!recentSessions || recentSessions.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--color-muted)] italic">
            No sessions recorded yet.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-xs min-w-[420px]">
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
          </div>
        )}
      </section>
    </div>
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
    <div>
      <p className="text-xs text-[var(--color-muted)]">
        Country / region / city pulled from Vercel&apos;s free request
        headers. No IPs stored. Visitor counts use a daily-rotating
        one-way hash.
      </p>
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Live right now" value={fmt(s7.live_now ?? 0)} sub="last 5 min" />
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
    </div>
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

  if (rows7.length === 0 && rows30.length === 0) {
    return (
      <p className="text-sm text-[var(--color-muted)] italic">
        No defendant-profile views yet.
      </p>
    );
  }

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
    <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
      <h3 className="text-lg font-bold tracking-tight">{title}</h3>
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
