import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { format, formatDistanceToNowStrict, subDays } from "date-fns";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Audience intelligence",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type PageViewRow = {
  session_id: string;
  user_id: string | null;
  path: string | null;
  ref: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  referrer_host: string | null;
  visitor_hash: string | null;
  device_kind: string | null;
  started_at: string;
  last_activity_at: string | null;
  scroll_max: number | null;
};

type EventRow = {
  session_id: string;
  kind: string | null;
  target: string | null;
  path: string | null;
  at: string;
};

type CommentRow = {
  id: string;
  user_id: string | null;
  body: string;
  created_at: string;
  post_id: string;
};

type LiveCommentRow = {
  id: string;
  live_stream_id: string;
  display_name: string | null;
  body: string;
  created_at: string;
  session_id: string | null;
  visitor_hash: string | null;
};

type PrivateMessageRow = {
  id: string;
  display_name: string | null;
  subject: string | null;
  message: string;
  source_path: string | null;
  created_at: string;
  session_id: string | null;
  visitor_hash: string | null;
};

type ProfileRow = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  verified_linked_account: boolean | null;
};

type VisitorDossier = {
  key: string;
  knownUserId: string | null;
  profile: ProfileRow | null;
  views: PageViewRow[];
  events: EventRow[];
  comments: CommentRow[];
  liveComments: LiveCommentRow[];
  privateMessages: PrivateMessageRow[];
  sessions: string[];
  firstView: PageViewRow;
  lastView: PageViewRow;
  pageCount: number;
  eventCount: number;
  dwellSeconds: number;
  avgScroll: number;
  score: number;
  intent: string;
  moneyMove: string;
  attentionSource: string;
  tags: string[];
};

function fmt(n: number | null | undefined): string {
  const v = n ?? 0;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(v);
}

function secondsBetween(start: string, end: string | null): number {
  if (!end) return 0;
  const diff = (new Date(end).getTime() - new Date(start).getTime()) / 1000;
  return Number.isFinite(diff) && diff > 0 && diff < 7200 ? Math.round(diff) : 0;
}

function countEvent(events: EventRow[], names: string[]): number {
  const wanted = new Set(names);
  return events.reduce((sum, event) => sum + (event.kind && wanted.has(event.kind) ? 1 : 0), 0);
}

function includesPath(views: PageViewRow[], match: string): boolean {
  return views.some((view) => view.path?.includes(match));
}

function topPath(views: PageViewRow[]): string {
  const counts = new Map<string, number>();
  for (const view of views) {
    if (!view.path) continue;
    counts.set(view.path, (counts.get(view.path) ?? 0) + 1);
  }
  return (
    Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ??
    views[0]?.path ??
    "/"
  );
}

function inferIntent(views: PageViewRow[], events: EventRow[]): string {
  if (countEvent(events, ["support_checkout_open", "support_intent_saved"]) > 0) {
    return "supporter / donor intent";
  }
  if (countEvent(events, ["tip_submit_success", "tip_submit_attempt"]) > 0) {
    return "tipster / source";
  }
  if (includesPath(views, "/case/nexus") || includesPath(views, "/case/")) {
    return "J6 case researcher";
  }
  if (includesPath(views, "/live") || countEvent(events, ["live_play", "live_replay_play"]) > 0) {
    return "live viewer";
  }
  if (includesPath(views, "/videos") || countEvent(events, ["video_play"]) > 0) {
    return "video watcher";
  }
  if (countEvent(events, ["comment_submit_success", "live_comment_success"]) > 0) {
    return "public conversation";
  }
  if (countEvent(events, ["subscribe_success", "follow_capture_success"]) > 0) {
    return "return-audience lead";
  }
  return "reader / evaluator";
}

function conversionScore(
  views: PageViewRow[],
  events: EventRow[],
  comments: CommentRow[],
  liveComments: LiveCommentRow[],
  privateMessages: PrivateMessageRow[],
): number {
  const dwell = views.reduce((sum, view) => sum + secondsBetween(view.started_at, view.last_activity_at), 0);
  const score =
    Math.min(20, views.length * 2) +
    Math.min(15, Math.round(dwell / 45)) +
    Math.min(15, events.length) +
    countEvent(events, ["share_copy", "share_native", "share_platform"]) * 4 +
    countEvent(events, ["comment_submit_success", "live_comment_success"]) * 8 +
    countEvent(events, ["subscribe_success", "follow_capture_success"]) * 10 +
    countEvent(events, ["support_intent_saved"]) * 15 +
    countEvent(events, ["support_checkout_open"]) * 20 +
    countEvent(events, ["tip_submit_success"]) * 12 +
    comments.length * 8 +
    liveComments.length * 8 +
    privateMessages.length * 15;
  return Math.min(100, score);
}

function moneyMove(views: PageViewRow[], events: EventRow[], score: number): string {
  if (countEvent(events, ["support_checkout_open"]) > 0) {
    return "Follow with proof of impact and a direct support reminder.";
  }
  if (countEvent(events, ["support_intent_saved"]) > 0) {
    return "Convert saved support intent into completed payment with transparent next-step copy.";
  }
  if (includesPath(views, "/case/") || includesPath(views, "/case/nexus")) {
    return "Ask for support tied to records work: filings, timelines, documents, and public case buildout.";
  }
  if (includesPath(views, "/videos") || includesPath(views, "/live")) {
    return "Push owned-video support: storage, streaming, transcripts, clips, and daily live rooms.";
  }
  if (score >= 50) {
    return "Show the support page after one more proof post; this visitor is already engaged.";
  }
  return "Keep feeding public proof first; ask for email/SMS before asking for money.";
}

function attentionSource(firstView: PageViewRow, events: EventRow[]): string {
  const acquisition = events.find((event) => event.kind === "acquisition" && event.target);
  if (acquisition?.target) {
    return acquisition.target.length > 140
      ? `${acquisition.target.slice(0, 140)}...`
      : acquisition.target;
  }
  return firstView.referrer_host || firstView.ref || "direct / unknown";
}

function tagsFor(
  views: PageViewRow[],
  events: EventRow[],
  comments: CommentRow[],
  liveComments: LiveCommentRow[],
  privateMessages: PrivateMessageRow[],
): string[] {
  const tags = new Set<string>();
  if (views.length > 3) tags.add("repeat reader");
  if (countEvent(events, ["video_play"]) > 0) tags.add("video");
  if (countEvent(events, ["live_play", "live_replay_play"]) > 0) tags.add("live");
  if (countEvent(events, ["share_copy", "share_native", "share_platform"]) > 0) tags.add("sharer");
  if (countEvent(events, ["subscribe_success", "follow_capture_success"]) > 0) tags.add("subscriber");
  if (countEvent(events, ["support_intent_saved", "support_checkout_open"]) > 0) tags.add("money path");
  if (countEvent(events, ["tip_submit_success", "tip_submit_attempt"]) > 0) tags.add("tip/source");
  if (
    comments.length > 0 ||
    liveComments.length > 0 ||
    countEvent(events, ["comment_submit_success", "live_comment_success"]) > 0
  ) {
    tags.add("commenter");
  }
  if (privateMessages.length > 0 || countEvent(events, ["private_message_success"]) > 0) {
    tags.add("direct contact");
  }
  if (includesPath(views, "/case/")) tags.add("case");
  return Array.from(tags);
}

export default async function AdminAudiencePage() {
  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=/admin/audience");
  const { data: adminCheck } = await supabase.rpc("is_admin", { uid: auth.user.id });
  if (adminCheck !== true) {
    return (
      <article className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Not authorized</h1>
      </article>
    );
  }

  const now = new Date();
  const since = subDays(now, 30).toISOString();

  const [
    { data: viewsRaw },
    { data: eventsRaw },
    { data: commentsRaw },
    { data: liveCommentsRaw },
    { data: privateMessagesRaw },
  ] = await Promise.all([
    supabase
      .from("page_views")
      .select(
        "session_id, user_id, path, ref, country, region, city, referrer_host, visitor_hash, device_kind, started_at, last_activity_at, scroll_max",
      )
      .gte("started_at", since)
      .order("started_at", { ascending: false })
      .limit(5000),
    supabase
      .from("page_events")
      .select("session_id, kind, target, path, at")
      .gte("at", since)
      .order("at", { ascending: false })
      .limit(10000),
    supabase
      .from("comments")
      .select("id, user_id, body, created_at, post_id")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(250),
    supabase
      .from("live_comments")
      .select("id, live_stream_id, display_name, body, created_at, session_id, visitor_hash")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(250),
    supabase
      .from("private_messages")
      .select("id, display_name, subject, message, source_path, created_at, session_id, visitor_hash")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(250),
  ]);

  const views = (viewsRaw ?? []) as PageViewRow[];
  const events = (eventsRaw ?? []) as EventRow[];
  const comments = (commentsRaw ?? []) as CommentRow[];
  const liveComments = (liveCommentsRaw ?? []) as LiveCommentRow[];
  const privateMessages = (privateMessagesRaw ?? []) as PrivateMessageRow[];

  const userIds = Array.from(
    new Set(
      [
        ...views.map((view) => view.user_id),
        ...comments.map((comment) => comment.user_id),
      ].filter((id): id is string => Boolean(id)),
    ),
  );
  const { data: profilesRaw } =
    userIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, display_name, avatar_url, verified_linked_account")
          .in("id", userIds)
      : { data: [] };
  const profileMap = new Map((profilesRaw ?? []).map((profile) => [profile.id, profile as ProfileRow]));

  const viewsByVisitor = new Map<string, PageViewRow[]>();
  for (const view of views) {
    const key = view.visitor_hash || `session:${view.session_id}`;
    const list = viewsByVisitor.get(key) ?? [];
    list.push(view);
    viewsByVisitor.set(key, list);
  }

  const eventsBySession = new Map<string, EventRow[]>();
  for (const event of events) {
    const list = eventsBySession.get(event.session_id) ?? [];
    list.push(event);
    eventsBySession.set(event.session_id, list);
  }

  const commentsByUser = new Map<string, CommentRow[]>();
  for (const comment of comments) {
    if (!comment.user_id) continue;
    const list = commentsByUser.get(comment.user_id) ?? [];
    list.push(comment);
    commentsByUser.set(comment.user_id, list);
  }

  const dossiers: VisitorDossier[] = Array.from(viewsByVisitor.entries())
    .map(([key, visitorViews]) => {
      const sortedViews = visitorViews.sort(
        (a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime(),
      );
      const sessions = Array.from(new Set(sortedViews.map((view) => view.session_id)));
      const visitorEvents = sessions.flatMap((session) => eventsBySession.get(session) ?? []);
      const knownUserId = sortedViews.find((view) => view.user_id)?.user_id ?? null;
      const visitorComments = knownUserId ? commentsByUser.get(knownUserId) ?? [] : [];
      const visitorLiveComments = liveComments.filter(
        (comment) =>
          comment.visitor_hash === key ||
          (comment.session_id ? sessions.includes(comment.session_id) : false),
      );
      const visitorPrivateMessages = privateMessages.filter(
        (message) =>
          message.visitor_hash === key ||
          (message.session_id ? sessions.includes(message.session_id) : false),
      );
      const dwellSeconds = sortedViews.reduce(
        (sum, view) => sum + secondsBetween(view.started_at, view.last_activity_at),
        0,
      );
      const avgScroll =
        sortedViews.length > 0
          ? Math.round(
              sortedViews.reduce((sum, view) => sum + (view.scroll_max ?? 0), 0) /
                sortedViews.length,
            )
          : 0;
      const score = conversionScore(
        sortedViews,
        visitorEvents,
        visitorComments,
        visitorLiveComments,
        visitorPrivateMessages,
      );
      const firstView = sortedViews[0]!;
      const lastView = sortedViews[sortedViews.length - 1]!;
      return {
        key,
        knownUserId,
        profile: knownUserId ? profileMap.get(knownUserId) ?? null : null,
        views: sortedViews,
        events: visitorEvents.sort(
          (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
        ),
        comments: visitorComments,
        liveComments: visitorLiveComments.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        ),
        privateMessages: visitorPrivateMessages.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        ),
        sessions,
        firstView,
        lastView,
        pageCount: sortedViews.length,
        eventCount: visitorEvents.length,
        dwellSeconds,
        avgScroll,
        score,
        intent: inferIntent(sortedViews, visitorEvents),
        moneyMove: moneyMove(sortedViews, visitorEvents, score),
        attentionSource: attentionSource(firstView, visitorEvents),
        tags: tagsFor(
          sortedViews,
          visitorEvents,
          visitorComments,
          visitorLiveComments,
          visitorPrivateMessages,
        ),
      };
    })
    .sort((a, b) => b.score - a.score || b.pageCount - a.pageCount)
    .slice(0, 60);

  const known = dossiers.filter((dossier) => dossier.knownUserId).length;
  const moneyCandidates = dossiers.filter((dossier) => dossier.score >= 50).length;
  const totalDwell = dossiers.reduce((sum, dossier) => sum + dossier.dwellSeconds, 0);
  const totalEvents = dossiers.reduce((sum, dossier) => sum + dossier.eventCount, 0);
  const directSignals = dossiers.reduce(
    (sum, dossier) =>
      sum + dossier.comments.length + dossier.liveComments.length + dossier.privateMessages.length,
    0,
  );

  return (
    <article className="mx-auto max-w-6xl px-4 py-10">
      <p className="text-xs uppercase tracking-wider text-[var(--color-accent)] font-bold">
        Admin · audience intelligence
      </p>
      <h1 className="mt-2 text-3xl sm:text-4xl font-black tracking-tight">
        Visitor profiles and conversion intent
      </h1>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[var(--color-ink-soft)]">
        Privacy-safe visitor dossiers from first-party data: session id,
        stable visitor hash, logged-in user id when available, location, device,
        referrer, first page, last page, dwell, scroll, clicks, comments,
        support actions, and conversion prediction. Raw IP addresses are not
        stored.
      </p>

      <section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="Visitor profiles" value={fmt(dossiers.length)} sub="last 30 days" />
        <Stat label="Known users" value={fmt(known)} sub="signed-in matches" />
        <Stat label="Money candidates" value={fmt(moneyCandidates)} sub="score 50+" />
        <Stat label="Direct signals" value={fmt(directSignals)} sub="comments + messages" />
        <Stat label="Tracked actions" value={fmt(totalEvents)} sub={`${fmt(totalDwell)}s dwell`} />
      </section>

      <section className="mt-8 space-y-4">
        {dossiers.length === 0 ? (
          <p className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 text-sm text-[var(--color-muted)]">
            No audience data yet.
          </p>
        ) : null}
        {dossiers.map((dossier) => (
          <article
            key={dossier.key}
            className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-bold">
                  {dossier.profile?.display_name || dossier.knownUserId ? "Known visitor" : "Anonymous visitor"}
                </p>
                <h2 className="mt-1 text-xl font-black tracking-tight">
                  {dossier.profile?.display_name ||
                    (dossier.knownUserId ? `User ${dossier.knownUserId.slice(0, 8)}` : `Visitor ${dossier.key.slice(0, 10)}`)}
                </h2>
                <p className="mt-1 font-mono text-xs text-[var(--color-muted)]">
                  visitor={dossier.key.slice(0, 18)} · sessions={dossier.sessions
                    .map((session) => session.slice(0, 8))
                    .join(", ")}
                </p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-black tabular-nums text-[var(--color-accent)]">
                  {dossier.score}
                </div>
                <p className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-bold">
                  conversion score
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Tag>{dossier.intent}</Tag>
              {dossier.tags.map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-4">
              <Mini label="First landing" value={dossier.firstView.path ?? "/"} href={dossier.firstView.path ?? "/"} />
              <Mini label="Last page" value={dossier.lastView.path ?? "/"} href={dossier.lastView.path ?? "/"} />
              <Mini label="Top page" value={topPath(dossier.views)} href={topPath(dossier.views)} />
              <Mini
                label="Location/device"
                value={[
                  dossier.lastView.city,
                  dossier.lastView.region,
                  dossier.lastView.country,
                ]
                  .filter(Boolean)
                  .join(", ") || "unknown"}
                sub={dossier.lastView.device_kind ?? "unknown device"}
              />
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
              <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] p-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-[var(--color-muted)]">
                  Prediction and money move
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                  <strong className="text-[var(--color-ink)]">How we got attention:</strong>{" "}
                  {dossier.attentionSource}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                  <strong className="text-[var(--color-ink)]">What they likely want:</strong>{" "}
                  {dossier.intent}; strongest page signal is{" "}
                  <Link
                    href={topPath(dossier.views)}
                    className="text-[var(--color-accent)] underline"
                  >
                    {topPath(dossier.views)}
                  </Link>
                  .
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                  <strong className="text-[var(--color-ink)]">Convert attention to money:</strong>{" "}
                  {dossier.moneyMove}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Stat label="Views" value={fmt(dossier.pageCount)} sub={`${fmt(dossier.sessions.length)} sessions`} />
                <Stat label="Actions" value={fmt(dossier.eventCount)} sub="clicks/events" />
                <Stat label="Dwell" value={`${fmt(dossier.dwellSeconds)}s`} sub="known time" />
                <Stat label="Scroll" value={`${dossier.avgScroll}%`} sub="avg max" />
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-[var(--color-muted)]">
                  Recent path/action trail
                </h3>
                <ol className="mt-2 space-y-1.5">
                  {[...dossier.views]
                    .sort(
                      (a, b) =>
                        new Date(b.started_at).getTime() - new Date(a.started_at).getTime(),
                    )
                    .slice(0, 8)
                    .map((view) => (
                      <li key={`${view.session_id}-${view.path}-${view.started_at}`} className="text-xs">
                        <Link
                          href={view.path ?? "/"}
                          className="font-mono text-[var(--color-accent)] hover:underline"
                        >
                          {view.path ?? "/"}
                        </Link>{" "}
                        <span className="text-[var(--color-muted)]">
                          {formatDistanceToNowStrict(new Date(view.started_at), {
                            addSuffix: true,
                          })}
                        </span>
                      </li>
                    ))}
                </ol>
              </div>

              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-[var(--color-muted)]">
                  What they clicked / said
                </h3>
                <ol className="mt-2 space-y-1.5">
                  {dossier.events.slice(0, 6).map((event) => (
                    <li key={`${event.kind}-${event.at}-${event.path}`} className="text-xs">
                      <span className="font-mono text-[var(--color-ink)]">{event.kind}</span>
                      {event.target ? (
                        <span className="text-[var(--color-muted)]">
                          {" "}
                          · {event.target.length > 90 ? `${event.target.slice(0, 90)}...` : event.target}
                        </span>
                      ) : null}
                    </li>
                  ))}
                  {dossier.comments.slice(0, 3).map((comment) => (
                    <li key={comment.id} className="text-xs">
                      <span className="font-bold text-[var(--color-ink)]">comment:</span>{" "}
                      <span className="text-[var(--color-muted)]">
                        {comment.body.length > 120 ? `${comment.body.slice(0, 120)}...` : comment.body}
                      </span>
                    </li>
                  ))}
                  {dossier.liveComments.slice(0, 3).map((comment) => (
                    <li key={comment.id} className="text-xs">
                      <span className="font-bold text-[var(--color-ink)]">
                        live comment{comment.display_name ? ` by ${comment.display_name}` : ""}:
                      </span>{" "}
                      <span className="text-[var(--color-muted)]">
                        {comment.body.length > 120 ? `${comment.body.slice(0, 120)}...` : comment.body}
                      </span>
                    </li>
                  ))}
                  {dossier.privateMessages.slice(0, 2).map((message) => (
                    <li key={message.id} className="text-xs">
                      <span className="font-bold text-[var(--color-ink)]">
                        private{message.display_name ? ` from ${message.display_name}` : ""}:
                      </span>{" "}
                      <span className="text-[var(--color-muted)]">
                        {(message.subject || message.message).length > 120
                          ? `${(message.subject || message.message).slice(0, 120)}...`
                          : message.subject || message.message}
                      </span>
                    </li>
                  ))}
                  {dossier.events.length === 0 &&
                  dossier.comments.length === 0 &&
                  dossier.liveComments.length === 0 &&
                  dossier.privateMessages.length === 0 ? (
                    <li className="text-xs italic text-[var(--color-muted)]">
                      No clicks or comments captured yet.
                    </li>
                  ) : null}
                </ol>
              </div>
            </div>
          </article>
        ))}
      </section>

      <p className="mt-8 text-xs text-[var(--color-muted)]">
        Snapshot taken {format(now, "MMM d, yyyy h:mma")} ·{" "}
        <Link href="/admin/analytics" className="underline">
          Analytics
        </Link>{" "}
        ·{" "}
        <Link href="/admin/new" className="underline">
          Create post
        </Link>
      </p>
    </article>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] px-4 py-3">
      <div className="text-2xl font-black tracking-tight">{value}</div>
      <div className="mt-1 text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-bold">
        {label}
      </div>
      {sub ? <div className="mt-1 text-xs text-[var(--color-ink-soft)]">{sub}</div> : null}
    </div>
  );
}

function Mini({
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
      <p className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-bold">
        {label}
      </p>
      <p className="mt-1 truncate font-mono text-xs text-[var(--color-ink)]">{value}</p>
      {sub ? <p className="mt-1 text-xs text-[var(--color-muted)]">{sub}</p> : null}
    </>
  );
  const classes = "rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] p-3";
  return href ? (
    <Link href={href} className={`${classes} block hover:border-[var(--color-accent)]`}>
      {body}
    </Link>
  ) : (
    <div className={classes}>{body}</div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-[var(--color-accent-soft)] px-3 py-1 text-xs font-bold text-[var(--color-accent)]">
      {children}
    </span>
  );
}
