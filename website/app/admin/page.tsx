import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";
import { getSupabaseServerClient } from "@/lib/supabase/server";

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
    { count: subs7d },
    { count: commentReports },
    { count: pendingTips },
    { count: pendingClaims },
    { count: pendingSubmissions },
    { data: pendingProfilesList },
    { data: recentSubs },
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
  ]);

  return (
    <article className="mx-auto max-w-5xl px-4 py-10">
      <p className="text-xs uppercase tracking-wider text-[var(--color-accent)] font-bold">
        Admin
      </p>
      <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight">
        Dashboard
      </h1>
      <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
        Site at a glance — visitors, pending review, recent activity. Drill in via the cards below.
      </p>

      {/* Top-line stats */}
      <section className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
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
      </section>

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

function refDomain(ref: string | null | undefined): string {
  if (!ref) return "direct";
  try {
    const url = new URL(ref);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return ref.slice(0, 30);
  }
}
