import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { PendingProfileActions } from "@/components/PendingProfileActions";
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

  // One row per VISITOR, not per page-view: latest page wins (rows arrive
  // newest-first), the rest just counts. Kills the six-duplicate-rows look.
  const visitorGroups = (() => {
    const map = new Map<
      string,
      {
        session_id: string;
        path: string;
        ref: string | null;
        user_id: string | null;
        last_activity_at: string;
        pages: number;
      }
    >();
    for (const s of recentSessions ?? []) {
      const g = map.get(s.session_id);
      if (!g) {
        map.set(s.session_id, {
          session_id: s.session_id,
          path: s.path,
          ref: s.ref,
          user_id: s.user_id,
          last_activity_at: s.last_activity_at,
          pages: 1,
        });
      } else {
        g.pages += 1;
        g.user_id = g.user_id ?? s.user_id;
        g.ref = g.ref ?? s.ref;
      }
    }
    return Array.from(map.values()).slice(0, 8);
  })();

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
          : "/admin/inbox";

  // The whole dashboard contract: a row exists ONLY if it needs Ryan's
  // hands. Zeros don't get cards — they get one calm sentence.
  const needsYou: { href: string; title: string; sub: string; count: string }[] = [];
  if (criticalIssues > 0) {
    needsYou.push({
      href: "/admin/health",
      title: `Fix ${criticalIssues} connection${criticalIssues === 1 ? "" : "s"}`,
      sub: "Email, payments, or database is off — usually why contact, tips, or pay feel broken.",
      count: String(criticalIssues),
    });
  }
  if (reviewQueueTotal > 0) {
    needsYou.push({
      href: reviewQueueHref,
      title: "Review tips & uploads",
      sub: `${pendingTips ?? 0} tips · ${pendingClaims ?? 0} claims · ${pendingSubmissions ?? 0} uploads · ${(pendingComments ?? 0) + (commentReports ?? 0)} comments`,
      count: String(reviewQueueTotal),
    });
  }
  if ((pendingPrivateMessages ?? 0) > 0) {
    needsYou.push({
      href: "/admin/messages?filter=new",
      title: "Answer private mail",
      sub: "New contact-form messages waiting on a reply.",
      count: String(pendingPrivateMessages ?? 0),
    });
  }
  if (receivableCents > 0) {
    needsYou.push({
      href: "/admin/invoices",
      title: "Collect on invoices",
      sub: `${invoices.length} open invoice${invoices.length === 1 ? "" : "s"} outstanding.`,
      count: usd(receivableCents),
    });
  }
  if ((pendingProfiles ?? 0) > 0) {
    needsYou.push({
      href: "/admin/users?filter=pending",
      title: "Approve new people",
      sub: "Verify or delete pending signups below.",
      count: String(pendingProfiles ?? 0),
    });
  }

  return (
    <article className="mx-auto max-w-3xl px-4 py-7">
      <p className="text-xs uppercase tracking-wider text-[var(--color-accent)] font-bold">
        Admin
      </p>
      <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight">
        What needs you now
      </h1>
      <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
        If it&apos;s not listed here, it&apos;s handled.
      </p>

      <section className="mt-6">
        {needsYou.length === 0 ? (
          <div className="rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] px-5 py-6">
            <p className="text-lg font-bold tracking-tight">All clear.</p>
            <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
              No tips waiting, no mail unanswered, no money to chase, nobody
              pending. Go write something.
            </p>
          </div>
        ) : (
          <div className="grid gap-2">
            {needsYou.map((row) => (
              <Link
                key={row.href}
                href={row.href}
                className="group flex items-center gap-4 rounded-md border border-[var(--color-accent)]/60 bg-[var(--color-accent)]/[0.07] px-4 py-3.5 transition hover:border-[var(--color-accent)] hover:bg-[var(--color-accent)]/15"
              >
                <span className="min-w-[3.25rem] shrink-0 text-right text-2xl font-bold tabular-nums tracking-tight text-[var(--color-accent)]">
                  {row.count}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[0.95rem] font-bold leading-tight text-[var(--color-ink)]">
                    {row.title}
                  </span>
                  <span className="mt-0.5 block text-xs leading-snug text-[var(--color-ink-soft)]">
                    {row.sub}
                  </span>
                </span>
                <span
                  aria-hidden
                  className="shrink-0 text-[var(--color-muted)] transition group-hover:translate-x-0.5 group-hover:text-[var(--color-accent)]"
                >
                  →
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* The pulse — every number that used to be a card, at whisper volume. */}
      <section className="mt-6 rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] px-5 py-4">
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
          <Pulse href="/admin/analytics" n={activeNow ?? 0} label="live now" live={(activeNow ?? 0) > 0} />
          <Pulse href="/admin/analytics" n={views24h ?? 0} label="views · 24h" />
          <Pulse href="/admin/posts" n={draftPostsCount ?? 0} label="drafts" />
          <Pulse href="/admin/posts" n={publishedPostsCount ?? 0} label="posts live" />
          <Pulse href="/admin/leads" n={leadsTotal} label="leads" />
          <Pulse href="/admin/chats" n={chats24h} label="chats · 24h" />
          <Pulse href="/admin/users" n={activeProfiles ?? 0} label="members" />
        </div>
      </section>

      {/* Pending verifications — rendered ONLY when someone is waiting. */}
      {(pendingProfiles ?? 0) > 0 ? (
      <section className="mt-8 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-muted)]">
              Needs a human
            </p>
            <h2 className="mt-0.5 font-display text-xl font-bold tracking-tight">
              Pending verification
              {(pendingProfiles ?? 0) > 0 ? (
                <span className="ml-2 inline-block rounded-full bg-[var(--color-navy)] px-2 py-0.5 align-middle text-xs font-bold text-[#fdf8ea]">
                  {pendingProfiles}
                </span>
              ) : null}
            </h2>
          </div>
          <Link
            href="/admin/users?filter=pending"
            className="text-xs font-semibold text-[var(--color-navy)] hover:underline"
          >
            Open queue →
          </Link>
        </div>
        {!pendingProfilesList || pendingProfilesList.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--color-muted)] italic">
            Nobody waiting. Inbox zero.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {pendingProfilesList.map((p) => {
              const name = p.display_name || p.full_name || p.username;
              const ghost = !name && !p.username;
              return (
                <li
                  key={p.id}
                  className={[
                    "flex items-center gap-3 rounded-xl border p-3",
                    ghost
                      ? "border-dashed border-[var(--color-line)] bg-[var(--color-paper)]"
                      : "border-[var(--color-line)] bg-[var(--color-paper)]",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-bold",
                      ghost
                        ? "border border-dashed border-[var(--color-muted)] text-[var(--color-muted)]"
                        : "bg-[var(--color-blue-soft)] text-[var(--color-navy)]",
                    ].join(" ")}
                    aria-hidden
                  >
                    {ghost
                      ? "?"
                      : String(name ?? "??")
                          .split(/\s+/)
                          .slice(0, 2)
                          .map((w: string) => w[0]?.toUpperCase() ?? "")
                          .join("")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={[
                        "truncate text-sm font-bold",
                        ghost ? "text-[var(--color-muted)]" : "text-[var(--color-ink)]",
                      ].join(" ")}
                    >
                      {name ?? "Abandoned signup"}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-[var(--color-muted)]">
                      {p.username ? (
                        <span className="rounded border border-[var(--color-line)] bg-[var(--color-surface)] px-1.5 py-0.5 font-mono text-[10px]">
                          @{p.username}
                        </span>
                      ) : null}
                      {ghost ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          never finished · safe to delete
                        </span>
                      ) : null}
                      <span>
                        {formatDistanceToNowStrict(new Date(p.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </p>
                  </div>
                  <PendingProfileActions id={p.id} />
                </li>
              );
            })}
          </ul>
        )}
      </section>
      ) : null}

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
        {visitorGroups.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--color-muted)] italic">
            Nobody on the site in the last 5 minutes.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {visitorGroups.map((v) => (
              <li
                key={v.session_id}
                className="flex items-center gap-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] p-3"
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: dotColor(v.session_id) }}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-[var(--color-ink)]">
                    {humanizePath(v.path)}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-[var(--color-muted)]">
                    <span className="rounded border border-[var(--color-line)] bg-[var(--color-surface)] px-1.5 py-0.5 text-[10px] font-bold">
                      {refDomain(v.ref) === "direct" ? "came direct" : `via ${refDomain(v.ref)}`}
                    </span>
                    {v.pages > 1 ? <span>{v.pages} pages this visit</span> : null}
                    <span>
                      {formatDistanceToNowStrict(new Date(v.last_activity_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </p>
                </div>
                {v.user_id ? (
                  <span className="shrink-0 rounded-full bg-[var(--color-navy)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#fdf8ea]">
                    Signed in
                  </span>
                ) : (
                  <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                    Visitor
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </article>
  );
}

// One number in the pulse strip: quiet, linked, no card chrome.
function Pulse({
  href,
  n,
  label,
  live,
}: {
  href: string;
  n: number;
  label: string;
  live?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group inline-flex items-baseline gap-1.5 rounded-sm px-1 py-0.5 transition hover:bg-[var(--color-paper)]"
    >
      {live ? (
        <span className="inline-block h-2 w-2 self-center rounded-full bg-green-500 animate-pulse" aria-hidden />
      ) : null}
      <span className="text-lg font-bold tabular-nums tracking-tight text-[var(--color-ink)]">
        {n.toLocaleString()}
      </span>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted)] transition group-hover:text-[var(--color-accent)]">
        {label}
      </span>
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

function titleizeSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => (w[0]?.toUpperCase() ?? "") + w.slice(1))
    .join(" ");
}

// Turn a raw path into what the visitor is actually DOING — the dashboard
// should read like a room, not a log file.
function humanizePath(path: string): string {
  const clean = path.split("?")[0] || "/";
  if (clean === "/") return "Reading the feed";
  if (clean.startsWith("/posts/"))
    return `Reading: ${titleizeSlug(clean.split("/")[2] ?? "a post")}`;
  if (clean.startsWith("/case/documents/"))
    return `In the evidence: ${titleizeSlug(clean.split("/")[3] ?? "")}`;
  if (clean.startsWith("/case")) return "Studying the case";
  if (clean.startsWith("/book")) return "Looking at the book";
  if (clean.startsWith("/store")) return "In the store";
  if (clean.startsWith("/videos")) return "Watching videos";
  if (clean.startsWith("/services") || clean.startsWith("/case-builder"))
    return "Checking the services";
  if (clean.startsWith("/admin")) return "You — in the back office";
  if (clean.startsWith("/j6")) return "On the J6 mission page";
  const seg = clean.split("/")[1];
  return seg ? `On ${titleizeSlug(seg)}` : clean;
}

// Flat palette dot per visitor — deterministic from the session id, so the
// same person keeps the same color while you watch.
const DOT_COLORS = [
  "var(--color-navy)",
  "var(--color-gold)",
  "var(--color-success)",
  "var(--color-tag-procedural)",
  "var(--color-blue)",
];
function dotColor(sessionId: string): string {
  let h = 0;
  for (let i = 0; i < sessionId.length; i++) {
    h = (h * 31 + sessionId.charCodeAt(i)) >>> 0;
  }
  return DOT_COLORS[h % DOT_COLORS.length]!;
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
