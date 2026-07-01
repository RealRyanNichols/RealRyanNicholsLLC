import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  getIntegrationHealth,
  countCriticalIssues,
} from "@/lib/integration-health";
import {
  getSupabaseServiceClient,
  isSupabaseServiceConfigured,
} from "@/lib/supabase/service";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

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

  const [
    { count: activeNow },
    { count: views24h },
    { count: pendingProfiles },
    { count: activeProfiles },
    { count: pendingComments },
    { count: pendingPrivateMessages },
    { count: commentReports },
    { count: pendingTips },
    { count: pendingClaims },
    { count: pendingSubmissions },
    { data: pendingProfilesList },
    { data: recentSessions },
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
      .from("page_views")
      .select("session_id, user_id, path, started_at, last_activity_at, ref")
      .gte("last_activity_at", fiveMinAgo)
      .order("last_activity_at", { ascending: false })
      .limit(10),
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

  // Posts/drafts — the area Ryan wants front-and-center.
  const [{ count: draftPostsCount }, { count: publishedPostsCount }] =
    await Promise.all([
      supabase
        .from("posts")
        .select("id", { count: "exact", head: true })
        .eq("status", "draft"),
      supabase
        .from("posts")
        .select("id", { count: "exact", head: true })
        .eq("status", "published"),
    ]);

  // Conversations ("the brain") — read via the service client since the chat
  // tables are admin-only (RLS deny-all).
  let chats24h = 0;
  let chatsTotal = 0;
  let leadsTotal = 0;
  if (isSupabaseServiceConfigured()) {
    try {
      const svc = getSupabaseServiceClient();
      const [{ count: c24 }, { count: cTot }, { count: lTot }] = await Promise.all([
        svc
          .from("chat_sessions")
          .select("id", { count: "exact", head: true })
          .gte("last_at", oneDayAgo),
        svc.from("chat_sessions").select("id", { count: "exact", head: true }),
        svc.from("leads").select("id", { count: "exact", head: true }),
      ]);
      chats24h = c24 ?? 0;
      chatsTotal = cTot ?? 0;
      leadsTotal = lTot ?? 0;
    } catch {
      /* chat + lead storage optional */
    }
  }

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

  return (
    <article className="mx-auto max-w-[78rem] px-4 py-7">
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
          className="mt-5 flex items-center justify-between gap-3 rounded-md border border-[var(--color-accent)] bg-[var(--color-accent)]/10 px-4 py-3 transition hover:bg-[var(--color-accent)]/15"
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
          href="/admin/posts"
          kicker="Publish"
          title="Posts & drafts"
          value={String(draftPostsCount ?? 0)}
          sub={`${draftPostsCount ?? 0} draft${(draftPostsCount ?? 0) === 1 ? "" : "s"} · ${publishedPostsCount ?? 0} live`}
          hot={(draftPostsCount ?? 0) > 0}
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
          href="/admin/chats"
          kicker="Chats"
          title="Conversations"
          value={String(chats24h)}
          sub={`${chatsTotal} total · talking to your AI`}
          hot={chats24h > 0}
        />
        <ActionLane
          href="/admin/leads"
          kicker="Leads"
          title="Leads"
          value={String(leadsTotal)}
          sub="people who left you data — follow up & sell"
          hot={leadsTotal > 0}
        />
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
          href="/admin/users?filter=pending"
          kicker="Approve"
          title="People"
          value={String(pendingProfiles ?? 0)}
          sub={`${activeProfiles ?? 0} active profiles`}
          hot={(pendingProfiles ?? 0) > 0}
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

      {/* Action items — pending verifications */}
      <section className="mt-8 rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
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
        className="mt-6 rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-5"
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
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[560px] text-xs">
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
          </div>
        )}
      </section>
    </article>
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
        "block rounded-md border p-4 transition hover:border-[var(--color-accent)]",
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
