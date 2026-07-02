import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  getSupabaseServiceClient,
  isSupabaseServiceConfigured,
} from "@/lib/supabase/service";

export const metadata: Metadata = {
  title: "Inbox",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

// THE INBOX. Every way a human reaches the site — tip line, contact form,
// evidence uploads, profile claims, lead capture — lands here as ONE
// chronological queue, tagged by type, pending-first. This page is the
// triage layer: see it, understand it, jump to the surface that acts on it.
// The specialized queues (tips, messages, claims…) stay as the work rooms.

type InboxKind = "tip" | "message" | "evidence" | "claim" | "lead";

type InboxItem = {
  kind: InboxKind;
  id: string;
  title: string;
  who: string;
  detail: string | null;
  when: string;
  pending: boolean;
  statusLabel: string;
  href: string;
};

const KIND_META: Record<
  InboxKind,
  { label: string; sub: string; chip: string }
> = {
  tip: {
    label: "Tip",
    sub: "story or case info from the tip line",
    chip: "bg-[var(--color-blue-soft)] text-[var(--color-navy)]",
  },
  message: {
    label: "Message",
    sub: "someone writing you directly",
    chip: "bg-[var(--color-accent-soft)] text-[var(--color-accent)]",
  },
  evidence: {
    label: "Evidence",
    sub: "claimant upload awaiting approval",
    chip: "bg-[var(--color-gold-soft)] text-[var(--color-support-strong)]",
  },
  claim: {
    label: "Claim",
    sub: "“that profile is me” — verify identity",
    chip: "bg-[var(--color-success-soft)] text-[var(--color-success)]",
  },
  lead: {
    label: "Lead",
    sub: "left contact data — follow up & sell",
    chip: "bg-[var(--color-surface-2)] text-[var(--color-ink-soft)]",
  },
};

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .slice(0, 2)
      .map((w: string) => w[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

export default async function AdminInboxPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=/admin/inbox");
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

  const { type } = await searchParams;
  const typeFilter: InboxKind | null =
    type === "tip" ||
    type === "message" ||
    type === "evidence" ||
    type === "claim" ||
    type === "lead"
      ? type
      : null;

  const [tipsRes, messagesRes, evidenceRes, claimsRes] = await Promise.all([
    supabase
      .from("case_tips")
      .select("id, defendant_name, submitter_name, narrative, status, created_at")
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("private_messages")
      .select("id, display_name, email, subject, message, status, created_at")
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("case_documents")
      .select("id, title, submission_status, created_at")
      .not("submitted_by_user_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("case_person_claims")
      .select("id, claimant_email, status, created_at")
      .order("created_at", { ascending: false })
      .limit(40),
  ]);

  // Leads live behind the service role (RLS deny-all), same as the dashboard.
  let leadRows: { email: string | null; name: string | null; source: string | null; reason: string | null; last_seen: string | null }[] = [];
  if (isSupabaseServiceConfigured()) {
    try {
      const svc = getSupabaseServiceClient();
      const { data } = await svc
        .from("leads")
        .select("email, name, source, reason, last_seen")
        .order("last_seen", { ascending: false })
        .limit(40);
      leadRows = data ?? [];
    } catch {
      /* leads optional */
    }
  }

  const items: InboxItem[] = [
    ...(tipsRes.data ?? []).map((t): InboxItem => ({
      kind: "tip",
      id: t.id,
      title: t.defendant_name
        ? `About: ${t.defendant_name}`
        : (t.narrative ?? "").slice(0, 90) || "Tip",
      who: t.submitter_name || "Anonymous",
      detail: (t.narrative ?? "").slice(0, 140) || null,
      when: t.created_at,
      pending: t.status === "pending",
      statusLabel: t.status,
      href: "/admin/tips?filter=all",
    })),
    ...(messagesRes.data ?? []).map((m): InboxItem => ({
      kind: "message",
      id: m.id,
      title: m.subject || (m.message ?? "").slice(0, 90) || "Message",
      who: m.display_name || m.email || "Unknown sender",
      detail: (m.message ?? "").slice(0, 140) || null,
      when: m.created_at,
      pending: m.status === "new",
      statusLabel: m.status,
      href: "/admin/messages",
    })),
    ...(evidenceRes.data ?? []).map((d): InboxItem => ({
      kind: "evidence",
      id: d.id,
      title: d.title,
      who: "Claimant upload",
      detail: null,
      when: d.created_at,
      pending: d.submission_status === "pending",
      statusLabel: d.submission_status,
      href: "/admin/submissions?filter=pending",
    })),
    ...(claimsRes.data ?? []).map((c): InboxItem => ({
      kind: "claim",
      id: c.id,
      title: "Profile claim",
      who: c.claimant_email ?? "Unknown claimant",
      detail: null,
      when: c.created_at,
      pending: c.status === "pending",
      statusLabel: c.status,
      href: "/admin/claims?filter=pending",
    })),
    ...leadRows.map((l, i): InboxItem => ({
      kind: "lead",
      id: `${l.email ?? "lead"}-${i}`,
      title: l.reason ? `Wants: ${l.reason}` : "New lead",
      who: l.name || l.email || "Unnamed lead",
      detail: l.source ? `via ${l.source}` : null,
      when: l.last_seen ?? new Date(0).toISOString(),
      pending: true,
      statusLabel: "follow up",
      href: "/admin/leads",
    })),
  ]
    .filter((it) => (typeFilter ? it.kind === typeFilter : true))
    .sort((a, b) => {
      if (a.pending !== b.pending) return a.pending ? -1 : 1;
      return b.when.localeCompare(a.when);
    })
    .slice(0, 60);

  const counts: Record<InboxKind, number> = {
    tip: (tipsRes.data ?? []).filter((t) => t.status === "pending").length,
    message: (messagesRes.data ?? []).filter((m) => m.status === "new").length,
    evidence: (evidenceRes.data ?? []).filter(
      (d) => d.submission_status === "pending",
    ).length,
    claim: (claimsRes.data ?? []).filter((c) => c.status === "pending").length,
    lead: leadRows.length,
  };
  const needsYou = counts.tip + counts.message + counts.evidence + counts.claim;

  return (
    <article className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-muted)]">
        Everything incoming · one queue
      </p>
      <h1 className="mt-1 font-display text-3xl sm:text-4xl font-bold tracking-tight">
        Inbox
        {needsYou > 0 ? (
          <span className="ml-3 inline-block rounded-full bg-[var(--color-navy)] px-2.5 py-0.5 align-middle text-sm font-bold text-[#fdf8ea]">
            {needsYou}
          </span>
        ) : null}
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-[var(--color-ink-soft)]">
        Every way a human reaches the site, tagged and in one line. Work top to
        bottom — each row opens the room where you act on it.
      </p>

      {/* Type filters — each explains itself */}
      <nav className="mt-5 flex flex-wrap gap-2">
        <FilterChip href="/admin/inbox" active={!typeFilter} label="All" />
        {(Object.keys(KIND_META) as InboxKind[]).map((k) => (
          <FilterChip
            key={k}
            href={`/admin/inbox?type=${k}`}
            active={typeFilter === k}
            label={`${KIND_META[k].label}${counts[k] > 0 ? ` · ${counts[k]}` : ""}`}
            title={KIND_META[k].sub}
          />
        ))}
      </nav>

      <div className="mt-6 space-y-2">
        {items.length === 0 ? (
          <p className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6 text-sm italic text-[var(--color-muted)]">
            Inbox zero. Nothing incoming needs you.
          </p>
        ) : (
          items.map((it) => (
            <Link
              key={`${it.kind}-${it.id}`}
              href={it.href}
              className={[
                "flex items-center gap-3 rounded-xl border p-3 transition hover:border-[var(--color-navy)]",
                it.pending
                  ? "border-[var(--color-line)] bg-[var(--color-surface)]"
                  : "border-[var(--color-line-soft)] bg-[var(--color-paper)] opacity-70",
              ].join(" ")}
            >
              <span
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--color-blue-soft)] text-sm font-bold text-[var(--color-navy)]"
                aria-hidden
              >
                {initials(it.who)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${KIND_META[it.kind].chip}`}
                  >
                    {KIND_META[it.kind].label}
                  </span>
                  <span className="truncate text-sm font-bold text-[var(--color-ink)]">
                    {it.title}
                  </span>
                </p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-[var(--color-muted)]">
                  <span className="font-bold text-[var(--color-ink-soft)]">
                    {it.who}
                  </span>
                  <span>{it.statusLabel}</span>
                  <span>
                    {formatDistanceToNowStrict(new Date(it.when), {
                      addSuffix: true,
                    })}
                  </span>
                </p>
                {it.detail ? (
                  <p className="mt-1 truncate text-xs text-[var(--color-ink-soft)]">
                    {it.detail}
                  </p>
                ) : null}
              </div>
              <span
                aria-hidden
                className="shrink-0 text-[var(--color-muted)] transition group-hover:text-[var(--color-navy)]"
              >
                →
              </span>
            </Link>
          ))
        )}
      </div>
    </article>
  );
}

function FilterChip({
  href,
  active,
  label,
  title,
}: {
  href: string;
  active: boolean;
  label: string;
  title?: string;
}) {
  return (
    <Link
      href={href}
      title={title}
      className={[
        "rounded-full border px-3.5 py-1.5 text-xs font-bold transition",
        active
          ? "border-[var(--color-navy)] bg-[var(--color-navy)] text-[#fdf8ea]"
          : "border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-ink-soft)] hover:border-[var(--color-navy)] hover:text-[var(--color-navy)]",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}
