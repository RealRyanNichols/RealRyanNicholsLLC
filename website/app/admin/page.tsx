import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  getIntegrationHealth,
  countCriticalIssues,
} from "@/lib/integration-health";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type PathViewRow = {
  path: string | null;
};

type EventRow = {
  kind: string | null;
  path: string | null;
};

type AttentionRow = {
  path: string;
  views: number;
  money: number;
  shares: number;
  intake: number;
  score: number;
  href: string;
  action: string;
  tone: "money" | "share" | "intake" | "watch";
};

export default async function AdminHomePage() {
  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=/admin");
  const { data: adminCheck } = await supabase.rpc("is_admin", {
    uid: auth.user.id,
  });
  if (adminCheck !== true) {
    return (
      <article className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Not authorized</h1>
      </article>
    );
  }

  const criticalIssues = countCriticalIssues(getIntegrationHealth());

  const now = new Date();
  const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: activeNow },
    { count: views24h },
    { count: views7d },
    { count: pendingProfiles },
    { count: activeProfiles },
    { count: pendingComments },
    { count: pendingPrivateMessages },
    { count: subs7d },
    { count: commentReports },
    { count: pendingTips },
    { count: pendingClaims },
    { count: pendingSubmissions },
    { data: pendingProfilesList },
    { data: recentSubs },
    { data: recentSessions },
    { data: recentPathViews },
    { data: recentActionEvents },
  ] = await Promise.all([
    supabase
      .from("page_views")
      .select("id", { count: "exact", head: true })
      .gte("last_activity_at", fiveMinAgo),
    supabase
      .from("page_views")
      .select("id", { count: "exact", head: true })
      .gte("started_at", oneDayAgo),
    supabase
      .from("page_views")
      .select("id", { count: "exact", head: true })
      .gte("started_at", sevenDaysAgo),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("comments")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("private_messages")
      .select("id", { count: "exact", head: true })
      .eq("status", "new"),
    supabase
      .from("notify_signups")
      .select("id", { count: "exact", head: true })
      .eq("channel", "email")
      .not("confirmed_at", "is", null)
      .gte("created_at", sevenDaysAgo),
    supabase
      .from("comment_reports")
      .select("id", { count: "exact", head: true })
      .eq("resolved", false),
    supabase
      .from("case_tips")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("case_person_claims")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("case_documents")
      .select("id", { count: "exact", head: true })
      .eq("submission_status", "pending")
      .not("submitted_by_user_id", "is", null),
    supabase
      .from("profiles")
      .select("id, display_name, full_name, username, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("notify_signups")
      .select("id, email, created_at, confirmed_at")
      .eq("channel", "email")
      .not("email", "is", null)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("page_views")
      .select("session_id, user_id, path, started_at, last_activity_at, ref")
      .gte("last_activity_at", fiveMinAgo)
      .order("last_activity_at", { ascending: false })
      .limit(10),
    supabase
      .from("page_views")
      .select("path")
      .gte("started_at", oneDayAgo)
      .order("started_at", { ascending: false })
      .limit(1200),
    supabase
      .from("page_events")
      .select("kind, path")
      .gte("at", sevenDaysAgo)
      .order("at", { ascending: false })
      .limit(3000),
  ]);

  const { data: invoiceRows } = await supabase
    .from("service_invoices")
    .select("id, client_name, amount_cents, amount_paid_cents, status, due_at, stripe_hosted_invoice_url")
    .in("status", ["draft", "open", "failed"])
    .order("created_at", { ascending: false })
    .limit(6);
  const invoices = (invoiceRows ?? []) as {
    id: string;
    client_name: string;
    amount_cents: number;
    amount_paid_cents: number;
    status: string;
    due_at: string | null;
    stripe_hosted_invoice_url: string | null;
  }[];
  const receivableCents = invoices
    .filter((i) => i.status === "open" || i.status === "failed")
    .reduce((sum, i) => sum + Math.max(0, i.amount_cents - i.amount_paid_cents), 0);
  const reviewQueueTotal =
    (pendingTips ?? 0) +
    (pendingClaims ?? 0) +
    (pendingSubmissions ?? 0) +
    (pendingComments ?? 0) +
    (commentReports ?? 0);
  const reviewQueueHref =
    (pendingTips ?? 0) > 0
      ? "/admin/tips?filter=pending"
      : (pendingClaims ?? 0) > 0
        ? "/admin/claims?filter=pending"
        : (pendingSubmissions ?? 0) > 0
          ? "/admin/submissions?filter=pending"
          : "/admin";
  const attentionRows = buildAttentionRows(
    (recentPathViews ?? []) as PathViewRow[],
    (recentActionEvents ?? []) as EventRow[],
  );
  const bestMoneyPath = attentionRows.find((row) => row.money > 0);
  const hottestPath = attentionRows[0];

  return (
    <article className="mx-auto max-w-6xl px-4 py-8">
      <p className="text-xs uppercase tracking-wider text-[var(--color-accent)] font-bold">
        Admin control room
      </p>
      <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight">
        What needs attention now
      </h1>
      <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
        Money to collect, people to answer, records to approve, and the live
        public audience in one place.
      </p>

      {criticalIssues > 0 ? (
        <Link
          href="/admin/health"
          className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-[var(--color-accent)] bg-[var(--color-accent)]/10 px-4 py-3 transition hover:bg-[var(--color-accent)]/15"
        >
          <span className="text-sm">
            <span className="font-bold">
              {criticalIssues} core connection{criticalIssues === 1 ? "" : "s"} off
            </span>{" "}
            — email, payments, or database. Usually why contact / tips / pay feel
            broken.
          </span>
          <span className="shrink-0 text-xs font-semibold text-[var(--color-accent)] whitespace-nowrap">
            Fix →
          </span>
        </Link>
      ) : null}

      <section className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <ActionLane
          href="/admin/invoices"
          kicker="Collect"
          title="Receivables"
          value={usd(receivableCents)}
          sub={`${invoices.length} active invoice${invoices.length === 1 ? "" : "s"}`}
          hot={receivableCents > 0}
        />
        <ActionLane
          href="/admin/messages?filter=new"
          kicker="Answer"
          title="Private messages"
          value={String(pendingPrivateMessages ?? 0)}
          sub="new contact form messages"
          hot={(pendingPrivateMessages ?? 0) > 0}
        />
        <ActionLane
          href={reviewQueueHref}
          kicker="Review"
          title={(pendingTips ?? 0) > 0 ? "Tips need review" : "Tips & submissions"}
          value={String(reviewQueueTotal)}
          sub={`${pendingTips ?? 0} tips · ${pendingClaims ?? 0} claims · ${pendingSubmissions ?? 0} uploads`}
          hot={reviewQueueTotal > 0}
        />
        <ActionLane
          href="/admin/analytics"
          kicker="Watch"
          title="Live audience"
          value={String(activeNow ?? 0)}
          sub={`${views24h ?? 0} views in 24h`}
          hot={(activeNow ?? 0) > 0}
        />
        <ActionLane
          href="/admin/users?filter=pending"
          kicker="Approve"
          title="People"
          value={String(pendingProfiles ?? 0)}
          sub={`${activeProfiles ?? 0} active profiles`}
          hot={(pendingProfiles ?? 0) > 0}
        />
        <ActionLane
          href="/admin/posts"
          kicker="Publish"
          title="Posts & live"
          value="+"
          sub="posts, video, social share cards"
        />
        <ActionLane
          href="/admin/health"
          kicker="Fix"
          title="Connections"
          value={String(criticalIssues)}
          sub="email, payments, database, video"
          hot={criticalIssues > 0}
        />
      </section>

      {/* Top-line stats */}
      <section className="mt-8 grid grid-cols-2 sm:grid-cols-5 gap-3">
        <StatCard
          href="#live"
          label="Active now"
          value={String(activeNow ?? 0)}
          sub="last 5 min"
          highlight={(activeNow ?? 0) > 0}
        />
        <StatCard
          href="/admin/analytics"
          label="Views (24h)"
          value={String(views24h ?? 0)}
          sub={`${views7d ?? 0} this week`}
        />
        <StatCard
          href="/admin/users?filter=pending"
          label="Pending verify"
          value={String(pendingProfiles ?? 0)}
          sub={`${activeProfiles ?? 0} approved`}
          highlight={(pendingProfiles ?? 0) > 0}
        />
        <StatCard
          href="/admin/analytics"
          label="Subscribers"
          value={`+${subs7d ?? 0}`}
          sub="this week (confirmed)"
        />
        <StatCard
          href="/admin/invoices"
          label="Receivable"
          value={usd(receivableCents)}
          sub="open invoices"
          highlight={receivableCents > 0}
        />
      </section>

      {attentionRows.length > 0 ? (
        <section className="mt-6 overflow-hidden rounded-2xl border border-[#233a62] bg-[#071123] text-[#fdf8ea] shadow-xl">
          <div className="grid gap-px bg-white/10 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="bg-[#0d1a33] p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#7fe3a9]">
                Attention magnet
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight">
                Where the site is pulling people right now.
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[#cfd9ea]">
                Score weights views, money clicks, shares, and intake actions.
                Green means traffic is filling up. Gold means money path. Red
                means the page has attention but needs a stronger action.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <MagnetMiniStat
                  label="Hot path"
                  value={hottestPath?.path ?? "none"}
                  tone="green"
                />
                <MagnetMiniStat
                  label="Money signal"
                  value={bestMoneyPath ? bestMoneyPath.path : "not enough yet"}
                  tone={bestMoneyPath ? "gold" : "red"}
                />
              </div>
              <Link
                href="/admin/analytics"
                className="mt-4 inline-flex min-h-11 items-center rounded-full border border-[#7fa9e3]/50 bg-[#7fa9e3]/15 px-5 text-xs font-black uppercase tracking-wider text-[#dce8ff] transition hover:bg-[#7fa9e3] hover:text-[#071123]"
              >
                Open full analytics →
              </Link>
            </div>
            <div className="bg-[#071123] p-4 sm:p-5">
              <div className="grid gap-2">
                {attentionRows.slice(0, 6).map((row, index) => (
                  <AttentionMagnetRow key={row.path} row={row} rank={index + 1} />
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {invoices.length > 0 ? (
        <section className="mt-6 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold tracking-tight">
              Money to follow up
            </h2>
            <Link
              href="/admin/invoices"
              className="text-xs font-semibold text-[var(--color-accent)] hover:underline"
            >
              Open invoices →
            </Link>
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {invoices.slice(0, 4).map((invoice) => (
              <Link
                key={invoice.id}
                href="/admin/invoices"
                className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-3 transition hover:border-[var(--color-accent)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">
                      {invoice.client_name}
                    </p>
                    <p className="text-xs uppercase tracking-[0.12em] text-[var(--color-muted)]">
                      {invoice.status}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-bold tabular-nums">
                    {usd(Math.max(0, invoice.amount_cents - invoice.amount_paid_cents))}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* Action items — pending verifications */}
      <section className="mt-8 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold tracking-tight">
            Pending verification
            {(pendingProfiles ?? 0) > 0 ? (
              <span className="ml-2 inline-block rounded-full bg-[var(--color-accent)] px-2 py-0.5 text-xs font-bold text-black">
                {pendingProfiles}
              </span>
            ) : null}
          </h2>
          <Link
            href="/admin/users?filter=pending"
            className="text-xs font-semibold text-[var(--color-accent)] hover:underline"
          >
            Open queue →
          </Link>
        </div>
        {!pendingProfilesList || pendingProfilesList.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--color-muted)] italic">
            Nobody waiting. Inbox zero.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-[var(--color-line)]">
            {pendingProfilesList.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">
                    {p.display_name || p.full_name || p.username || "(no name)"}
                  </p>
                  <p className="text-xs text-[var(--color-muted)] font-mono truncate">
                    {p.username ? `@${p.username}` : "no handle"} ·{" "}
                    {formatDistanceToNowStrict(new Date(p.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                <Link
                  href="/admin/users?filter=pending"
                  className="text-xs font-semibold text-[var(--color-accent)] hover:underline whitespace-nowrap"
                >
                  Review →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Live now */}
      <section
        id="live"
        className="mt-6 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold tracking-tight">
            On the site right now
            {(activeNow ?? 0) > 0 ? (
              <span className="ml-2 inline-block h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
            ) : null}
          </h2>
          <Link
            href="/admin/analytics"
            className="text-xs font-semibold text-[var(--color-accent)] hover:underline"
          >
            Full analytics →
          </Link>
        </div>
        {!recentSessions || recentSessions.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--color-muted)] italic">
            Nobody on the site in the last 5 minutes.
          </p>
        ) : (
          <table className="mt-3 w-full text-xs">
            <thead className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-bold">
              <tr>
                <th className="text-left py-1">Session</th>
                <th className="text-left py-1">Path</th>
                <th className="text-left py-1">Referrer</th>
                <th className="text-right py-1">Last seen</th>
                <th className="text-right py-1">User</th>
              </tr>
            </thead>
            <tbody>
              {recentSessions.map((s) => (
                <tr
                  key={`${s.session_id}-${s.path}-${s.started_at}`}
                  className="border-t border-[var(--color-line)]"
                >
                  <td className="py-1.5 font-mono text-[10px] text-[var(--color-muted)]">
                    {s.session_id.slice(0, 8)}
                  </td>
                  <td className="py-1.5 font-mono truncate max-w-[200px]">
                    {s.path}
                  </td>
                  <td className="py-1.5 truncate max-w-[140px] text-[var(--color-ink-soft)]">
                    {refDomain(s.ref)}
                  </td>
                  <td className="py-1.5 text-right whitespace-nowrap">
                    {formatDistanceToNowStrict(new Date(s.last_activity_at), {
                      addSuffix: true,
                    })}
                  </td>
                  <td className="py-1.5 text-right">
                    {s.user_id ? (
                      <span className="text-[var(--color-accent)] font-semibold">
                        signed in
                      </span>
                    ) : (
                      "anon"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Recent signups */}
      <section className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
          <h2 className="text-lg font-bold tracking-tight">Newest subscribers</h2>
          <ul className="mt-3 space-y-2">
            {!recentSubs || recentSubs.length === 0 ? (
              <li className="text-sm text-[var(--color-muted)] italic">
                No subscribers yet.
              </li>
            ) : (
              recentSubs.map((s) => (
                <li
                  key={s.id}
                  className="text-sm flex items-center justify-between gap-3"
                >
                  <span className="font-mono truncate">{s.email}</span>
                  <span className="text-xs text-[var(--color-muted)] whitespace-nowrap">
                    {s.confirmed_at ? "✓" : "⏳"}{" "}
                    {formatDistanceToNowStrict(new Date(s.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
          <h2 className="text-lg font-bold tracking-tight">Moderation queue</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="flex items-center justify-between gap-3">
              <Link href="/admin/messages?filter=new" className="hover:text-[var(--color-accent)]">
                New private messages
              </Link>
              <span className="font-bold tabular-nums">
                {pendingPrivateMessages ?? 0}
              </span>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span>Comments awaiting approval</span>
              <span className="font-bold tabular-nums">
                {pendingComments ?? 0}
              </span>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span>Open comment reports</span>
              <span className="font-bold tabular-nums">
                {commentReports ?? 0}
              </span>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span>Pending profile verifications</span>
              <span className="font-bold tabular-nums">
                {pendingProfiles ?? 0}
              </span>
            </li>
            <li className="flex items-center justify-between gap-3">
              <Link href="/admin/tips?filter=pending" className="hover:text-[var(--color-accent)]">
                Pending tip-line submissions
              </Link>
              <span className="font-bold tabular-nums">
                {pendingTips ?? 0}
              </span>
            </li>
            <li className="flex items-center justify-between gap-3">
              <Link href="/admin/claims?filter=pending" className="hover:text-[var(--color-accent)]">
                Pending J6 profile claims
              </Link>
              <span className="font-bold tabular-nums">
                {pendingClaims ?? 0}
              </span>
            </li>
            <li className="flex items-center justify-between gap-3">
              <Link href="/admin/submissions?filter=pending" className="hover:text-[var(--color-accent)]">
                Pending claimant uploads
              </Link>
              <span className="font-bold tabular-nums">
                {pendingSubmissions ?? 0}
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* Quick links to sub-pages */}
      <section className="mt-8">
        <h2 className="text-sm uppercase tracking-wider text-[var(--color-muted)] font-bold">
          Sections
        </h2>
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
          <SectionLink
            href="/admin/invoices"
            title="Invoices"
            sub="Create payment links and track unpaid work"
          />
          <SectionLink
            href="/admin/orders"
            title="Orders"
            sub="Service and store checkout"
          />
          <SectionLink
            href="/admin/health"
            title="Connections"
            sub="Email, payments, keys — what's on"
          />
          <SectionLink
            href="/admin/users"
            title="Users"
            sub="Verify, ban, approve"
          />
          <SectionLink
            href="/admin/analytics"
            title="Analytics"
            sub="Pages, sessions, clicks"
          />
          <SectionLink
            href="/admin/case"
            title="Case data"
            sub="People, events, grievances"
          />
          <SectionLink
            href="/admin/case/scans"
            title="Case scans"
            sub="Upload & mirror evidence"
          />
          <SectionLink
            href="/admin/tips"
            title="Tips"
            sub="Public tip-line review"
          />
          <SectionLink
            href="/admin/claims"
            title="J6 claims"
            sub="Approve profile claims"
          />
          <SectionLink
            href="/admin/submissions"
            title="Submissions"
            sub="Review claimant uploads"
          />
          <SectionLink
            href="/admin/og-images"
            title="OG images"
            sub="Social share cards per page"
          />
          <SectionLink
            href="/admin/posts"
            title="Posts"
            sub="Pin, unpin, draft, delete"
          />
          <SectionLink
            href="/admin/imports"
            title="Imports"
            sub="Review docs scraped from Court Listener"
          />
          <SectionLink
            href="/admin/evidence/new"
            title="Lock in evidence"
            sub="Paste a tweet / article / clip and attach it"
          />
          <SectionLink
            href="/admin/new"
            title="New post"
            sub="Compose a post"
          />
          <SectionLink
            href="/admin/profile"
            title="My profile"
            sub="Avatar & bio"
          />
          <SectionLink
            href="/preview/palette"
            title="Palette preview"
            sub="Pick a color scheme"
          />
        </div>
      </section>
    </article>
  );
}

function StatCard({
  href,
  label,
  value,
  sub,
  highlight,
}: {
  href: string;
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        "block rounded-xl border px-4 py-3 transition hover:border-[var(--color-accent)]",
        highlight
          ? "border-[var(--color-accent)] bg-[var(--color-accent)]/5"
          : "border-[var(--color-line)] bg-[var(--color-surface)]",
      ].join(" ")}
    >
      <div className="text-3xl font-bold tracking-tight tabular-nums">
        {value}
      </div>
      <div className="text-[11px] uppercase tracking-wider text-[var(--color-muted)] mt-1 font-semibold">
        {label}
      </div>
      {sub ? (
        <div className="text-xs text-[var(--color-ink-soft)] mt-1">{sub}</div>
      ) : null}
    </Link>
  );
}

function buildAttentionRows(
  views: PathViewRow[],
  events: EventRow[],
): AttentionRow[] {
  const rows = new Map<string, AttentionRow>();
  const ensure = (path: string): AttentionRow => {
    const clean = path || "/";
    const existing = rows.get(clean);
    if (existing) return existing;
    const created: AttentionRow = {
      path: clean,
      href: clean.startsWith("/") ? clean : "/admin/analytics",
      views: 0,
      money: 0,
      shares: 0,
      intake: 0,
      score: 0,
      action: "Watch",
      tone: "watch",
    };
    rows.set(clean, created);
    return created;
  };

  for (const row of views) {
    if (!row.path) continue;
    ensure(row.path).views += 1;
  }

  const moneyKinds = new Set([
    "checkout_start",
    "donate_click",
    "fund_cover_fully",
    "fund_give_click",
    "service_cta_click",
    "support_checkout_open",
    "support_intent_saved",
    "supporter_click",
  ]);
  const shareKinds = new Set([
    "share_copy",
    "share_facebook",
    "share_menu_open",
    "share_native",
    "share_platform",
    "share_x",
    "tip_line_share_click",
  ]);
  const intakeKinds = new Set([
    "case_comment_submit_success",
    "comment_submit_success",
    "follow_capture_success",
    "guided_help_submit_success",
    "j6_free_claim",
    "private_message_success",
    "story_intake_submit_success",
    "subscribe_success",
    "tip_submit_success",
  ]);

  for (const event of events) {
    if (!event.path || !event.kind) continue;
    const row = ensure(event.path);
    if (moneyKinds.has(event.kind)) row.money += 1;
    if (shareKinds.has(event.kind)) row.shares += 1;
    if (intakeKinds.has(event.kind)) row.intake += 1;
  }

  return Array.from(rows.values())
    .map((row) => {
      const score = row.views + row.money * 28 + row.shares * 12 + row.intake * 16;
      const tone: AttentionRow["tone"] =
        row.money > 0 ? "money" : row.shares > 0 ? "share" : row.intake > 0 ? "intake" : "watch";
      const action =
        row.money > 0
          ? "Make this pay better"
          : row.shares > 0
            ? "Push the share loop"
            : row.intake > 0
              ? "Turn into follow-up"
              : "Add a sharper CTA";
      return { ...row, score, tone, action };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);
}

function MagnetMiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "green" | "gold" | "red";
}) {
  const toneClass =
    tone === "green"
      ? "border-[#7fe3a9]/40 bg-[#7fe3a9]/10 text-[#7fe3a9]"
      : tone === "gold"
        ? "border-[#e4c66a]/50 bg-[#e4c66a]/10 text-[#e4c66a]"
        : "border-[#ef6f61]/50 bg-[#ef6f61]/10 text-[#ef6f61]";
  return (
    <div className={`min-w-0 rounded-xl border p-3 ${toneClass}`}>
      <p className="text-[10px] font-black uppercase tracking-wider opacity-80">
        {label}
      </p>
      <p className="mt-1 truncate font-mono text-xs font-black">{value}</p>
    </div>
  );
}

function AttentionMagnetRow({ row, rank }: { row: AttentionRow; rank: number }) {
  const toneClass =
    row.tone === "money"
      ? "border-[#e4c66a]/50 bg-[#e4c66a]/10"
      : row.tone === "share"
        ? "border-[#7fa9e3]/50 bg-[#7fa9e3]/10"
        : row.tone === "intake"
          ? "border-[#7fe3a9]/50 bg-[#7fe3a9]/10"
          : "border-[#ef6f61]/45 bg-[#ef6f61]/10";
  const badge =
    row.tone === "money"
      ? "Money"
      : row.tone === "share"
        ? "Share"
        : row.tone === "intake"
          ? "Data"
          : "Leak";
  return (
    <Link
      href={row.href}
      className={`grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border p-3 transition hover:border-[#7fe3a9] ${toneClass}`}
    >
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 font-mono text-xs font-black tabular-nums">
        #{rank}
      </span>
      <span className="min-w-0">
        <span className="block truncate font-mono text-sm font-black text-[#fdf8ea]">
          {row.path}
        </span>
        <span className="mt-1 block text-xs text-[#cfd9ea]">
          {row.views.toLocaleString()} views · {row.money.toLocaleString()} money ·{" "}
          {row.shares.toLocaleString()} shares · {row.intake.toLocaleString()} data
        </span>
      </span>
      <span className="hidden text-right sm:block">
        <span className="block rounded-full bg-white/10 px-2 py-1 text-[10px] font-black uppercase text-[#fdf8ea]">
          {badge}
        </span>
        <span className="mt-1 block text-[10px] font-bold text-[#9fb0ca]">
          {row.action}
        </span>
      </span>
    </Link>
  );
}

function ActionLane({
  href,
  kicker,
  title,
  value,
  sub,
  hot,
}: {
  href: string;
  kicker: string;
  title: string;
  value: string;
  sub: string;
  hot?: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        "block rounded-2xl border p-4 transition hover:border-[var(--color-accent)]",
        hot
          ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10"
          : "border-[var(--color-line)] bg-[var(--color-surface)]",
      ].join(" ")}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-muted)]">
        {kicker}
      </p>
      <div className="mt-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold tracking-tight">{title}</h2>
          <p className="mt-1 text-xs text-[var(--color-ink-soft)]">{sub}</p>
        </div>
        <p className="shrink-0 text-2xl font-bold tracking-tight tabular-nums">
          {value}
        </p>
      </div>
    </Link>
  );
}

function SectionLink({
  href,
  title,
  sub,
}: {
  href: string;
  title: string;
  sub: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 transition hover:border-[var(--color-accent)]"
    >
      <div className="font-bold tracking-tight">{title}</div>
      <div className="text-xs text-[var(--color-muted)] mt-0.5">{sub}</div>
    </Link>
  );
}

function usd(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function refDomain(ref: string | null | undefined): string {
  if (!ref) return "direct";
  try {
    const url = new URL(ref);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return ref.slice(0, 30);
  }
}
