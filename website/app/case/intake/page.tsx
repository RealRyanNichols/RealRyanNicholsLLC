import type { Metadata } from "next";
import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";
import { IntakeSignalForm } from "@/components/IntakeSignalForm";
import {
  buildIntakeRoutePlan,
  type IntakeRouteKind,
  type IntakeRoutePlan,
} from "@/lib/intake-routing";
import { getSupabaseServiceClient, isSupabaseServiceConfigured } from "@/lib/supabase/service";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Public Intake Ledger | Real Ryan Nichols",
  description:
    "A public-safe ledger of tips and submissions received by Real Ryan Nichols LLC, with community verification and context signals.",
  alternates: { canonical: `${SITE.url}/case/intake` },
};

export const dynamic = "force-dynamic";

type IntakeItem = {
  id: string;
  public_ref: string;
  source_type: "tip" | "submission" | "tool" | "private_message";
  category: string;
  subject: string | null;
  location: string | null;
  public_summary: string;
  public_status: "received" | "triage" | "needs_verification" | "verified" | "merged" | "rejected";
  verify_count: number;
  dispute_count: number;
  context_count: number;
  connection_count: number;
  clue_tags: string[] | null;
  created_at: string;
  last_action_at: string;
};

type Search = { filter?: string; route?: string };

const statusCopy: Record<IntakeItem["public_status"], { label: string; cls: string }> = {
  received: {
    label: "Received",
    cls: "border-[var(--color-blue)] bg-[var(--color-blue-soft)] text-[var(--color-blue)]",
  },
  triage: {
    label: "Triage",
    cls: "border-[var(--color-gold)] bg-[var(--color-gold-soft)] text-[var(--color-ink)]",
  },
  needs_verification: {
    label: "Needs verification",
    cls: "border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]",
  },
  verified: {
    label: "Verified",
    cls: "border-[var(--color-success)] bg-[var(--color-success-soft)] text-[var(--color-success)]",
  },
  merged: {
    label: "Mapped",
    cls: "border-[var(--color-success)] bg-[var(--color-success-soft)] text-[var(--color-success)]",
  },
  rejected: {
    label: "Rejected",
    cls: "border-[var(--color-line)] bg-[var(--color-surface-2)] text-[var(--color-muted)]",
  },
};

const filterOptions = [
  { value: "all", label: "All" },
  { value: "tip", label: "Tips" },
  { value: "submission", label: "Submissions" },
  { value: "tool", label: "Tools" },
  { value: "private_message", label: "Private receipts" },
  { value: "needs_verification", label: "Needs verification" },
  { value: "verified", label: "Verified" },
];

const publicRouteCopy: Record<
  IntakeRouteKind,
  { label: string; helper: string; ask: string }
> = {
  case_map: {
    label: "Connection map",
    helper: "This lead is being treated like a clue that may connect to another case, person, agency, document, or timeline.",
    ask: "Help by adding a date, name, agency, case number, or record link that connects it.",
  },
  verify: {
    label: "Verification lane",
    helper: "This lead needs source support before anyone should rely on it publicly.",
    ask: "Help by adding native records, full screenshots, video, documents, or a correction.",
  },
  article: {
    label: "Story lead",
    helper: "This lead may become a public-safe explainer, update, or witness call once the record is checked.",
    ask: "Help by adding the one fact, document, or witness detail that would make the story stronger.",
  },
  service: {
    label: "Private follow-up",
    helper: "This looks like it may require a direct reply, case review, or service path before anything public happens.",
    ask: "Help by keeping private details private and sending clean contact information through the proper form.",
  },
  watch: {
    label: "Watch file",
    helper: "This has been received, but it needs one more concrete fact before it can move into a stronger lane.",
    ask: "Help by adding a date, place, person, document, or link.",
  },
};

const routeOrder: IntakeRouteKind[] = [
  "case_map",
  "verify",
  "article",
  "service",
  "watch",
];

export default async function IntakeLedgerPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const filter = sp.filter ?? "all";
  const routeFilter = isRouteKind(sp.route) ? sp.route : null;

  let items: IntakeItem[] = [];
  let counts = {
    total: 0,
    tips: 0,
    submissions: 0,
    tools: 0,
    privateMessages: 0,
    open: 0,
    signals: 0,
  };
  let error: string | null = null;

  if (isSupabaseServiceConfigured()) {
    const supabase = getSupabaseServiceClient();
    let query = supabase
      .from("intake_items")
      .select(
        "id, public_ref, source_type, category, subject, location, public_summary, public_status, verify_count, dispute_count, context_count, connection_count, clue_tags, created_at, last_action_at",
      )
      .eq("visibility", "public")
      .neq("public_status", "rejected")
      .order("last_action_at", { ascending: false })
      .limit(80);

    if (filter === "tip" || filter === "submission" || filter === "tool" || filter === "private_message") {
      query = query.eq("source_type", filter);
    } else if (filter !== "all" && filterOptions.some((o) => o.value === filter)) {
      query = query.eq("public_status", filter);
    }

    const { data, error: queryError } = await query;
    if (queryError) {
      error = queryError.message;
    } else {
      items = (data ?? []) as IntakeItem[];
    }

    const [
      { count: total },
      { count: tips },
      { count: submissions },
      { count: tools },
      { count: privateMessages },
      { count: open },
    ] =
      await Promise.all([
        supabase
          .from("intake_items")
          .select("id", { count: "exact", head: true })
          .eq("visibility", "public")
          .neq("public_status", "rejected"),
        supabase
          .from("intake_items")
          .select("id", { count: "exact", head: true })
          .eq("visibility", "public")
          .neq("public_status", "rejected")
          .eq("source_type", "tip"),
        supabase
          .from("intake_items")
          .select("id", { count: "exact", head: true })
          .eq("visibility", "public")
          .neq("public_status", "rejected")
          .eq("source_type", "submission"),
        supabase
          .from("intake_items")
          .select("id", { count: "exact", head: true })
          .eq("visibility", "public")
          .neq("public_status", "rejected")
          .eq("source_type", "tool"),
        supabase
          .from("intake_items")
          .select("id", { count: "exact", head: true })
          .eq("visibility", "public")
          .neq("public_status", "rejected")
          .eq("source_type", "private_message"),
        supabase
          .from("intake_items")
          .select("id", { count: "exact", head: true })
          .eq("visibility", "public")
          .in("public_status", ["received", "needs_verification", "triage"]),
      ]);

    counts = {
      total: total ?? 0,
      tips: tips ?? 0,
      submissions: submissions ?? 0,
      tools: tools ?? 0,
      privateMessages: privateMessages ?? 0,
      open: open ?? 0,
      signals: items.reduce(
        (sum, item) =>
          sum +
          item.verify_count +
          item.connection_count +
          item.dispute_count +
          item.context_count,
        0,
      ),
    };
  } else {
    error = "Supabase is not configured.";
  }
  const allRoutedItems = items.map((item) => ({
    item,
    plan: buildIntakeRoutePlan({
      category: item.category,
      subject: item.subject,
      location: item.location,
      narrative: item.public_summary,
      urls: null,
    }),
  }));
  const routeCounts = allRoutedItems.reduce(
    (acc, row) => {
      acc[row.plan.kind] = (acc[row.plan.kind] ?? 0) + 1;
      return acc;
    },
    {
      case_map: 0,
      verify: 0,
      article: 0,
      service: 0,
      watch: 0,
    } as Record<IntakeRouteKind, number>,
  );
  const routedItems = routeFilter
    ? allRoutedItems.filter((row) => row.plan.kind === routeFilter)
    : allRoutedItems;

  return (
    <article className="rrn-page">
      <section className="border-b border-[var(--color-line)] bg-[var(--color-paper)]">
        <div className="rrn-section grid gap-6 lg:grid-cols-[1fr_0.85fr] lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-normal text-[var(--color-success)]">
              Public intake ledger
            </p>
            <h1 className="rrn-section-title mt-2">
              Every tip should move the record.
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-[var(--color-ink-soft)]">
              This is the public-safe master list of tips and submissions that
              came into the site. Private details stay private. The public can
              help verify, connect, dispute, or add context to another case,
              document, witness, agency, or timeline.
            </p>
            <div className="rrn-tap-row mt-5">
              <Link
                href="/submit"
                className="rrn-tap rounded-lg bg-[var(--color-accent)] px-4 py-3 text-sm font-bold text-white transition hover:bg-[var(--color-accent-strong)]"
              >
                Submit another lead
              </Link>
              <Link
                href="/case/nexus"
                className="rrn-tap rounded-lg border border-[var(--color-line)] px-4 py-3 text-sm font-bold text-[var(--color-ink)] transition hover:border-[var(--color-accent)]"
              >
                Open case nexus
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
            <Stat label="Ledger items" value={counts.total} />
            <Stat label="Open leads" value={counts.open} tone="red" />
            <Stat label="Tips" value={counts.tips} />
            <Stat label="Submissions" value={counts.submissions} />
            <Stat label="Tools" value={counts.tools} />
            <Stat label="Private receipts" value={counts.privateMessages} />
          </div>
        </div>
      </section>

      <section className="rrn-section">
        <section className="mb-5 border border-[#203a64] bg-[#071126] p-4 text-[#fdf8ea] shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#7fe3a9]">
                Public action lanes
              </p>
              <h2 className="mt-1 font-sans text-2xl font-black text-[#fdf8ea]">
                A receipt is not enough. It has to move.
              </h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#cfd9ea]">
                Each public-safe item gets a lane so people can see what kind of
                help is needed next without exposing private details.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              <LaneStat
                label="Map"
                value={routeCounts.case_map}
                href={intakeHref(filter, "case_map")}
                active={routeFilter === "case_map"}
              />
              <LaneStat
                label="Verify"
                value={routeCounts.verify}
                href={intakeHref(filter, "verify")}
                active={routeFilter === "verify"}
              />
              <LaneStat
                label="Story"
                value={routeCounts.article}
                href={intakeHref(filter, "article")}
                active={routeFilter === "article"}
              />
              <LaneStat
                label="Follow up"
                value={routeCounts.service}
                href={intakeHref(filter, "service")}
                active={routeFilter === "service"}
              />
              <LaneStat
                label="Watch"
                value={routeCounts.watch}
                href={intakeHref(filter, "watch")}
                active={routeFilter === "watch"}
              />
            </div>
          </div>
          {routeFilter ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border border-white/10 bg-white/[0.055] p-3">
              <p className="text-sm font-bold leading-6 text-[#cfd9ea]">
                Showing the {publicRouteCopy[routeFilter].label.toLowerCase()} lane.
              </p>
              <Link
                href={intakeHref(filter, null)}
                className="border border-[#7fe3a9]/50 px-3 py-2 text-xs font-black uppercase tracking-normal text-[#7fe3a9] transition hover:bg-[#7fe3a9]/15"
              >
                Show all lanes
              </Link>
            </div>
          ) : null}
        </section>

        <nav className="flex gap-2 overflow-x-auto border-b border-[var(--color-line)] pb-3">
          {filterOptions.map((option) => (
            <Link
              key={option.value}
              href={intakeHref(option.value, routeFilter)}
              className={[
                "rrn-tap whitespace-nowrap rounded-full border px-4 py-2 text-sm font-bold transition",
                filter === option.value || (filter === "all" && option.value === "all")
                  ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white"
                  : "border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-ink)] hover:border-[var(--color-accent)]",
              ].join(" ")}
            >
              {option.label}
            </Link>
          ))}
        </nav>

        {error ? (
          <p className="mt-5 rounded-lg border border-[var(--color-accent)] bg-[var(--color-accent-soft)] p-3 text-sm font-bold text-[var(--color-accent)]">
            {error}
          </p>
        ) : null}

        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_20rem]">
          <div className="space-y-4">
            {items.length === 0 ? (
              <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
                <p className="font-bold">No public-safe items in this bucket yet.</p>
                <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
                  Submit a tip and the ledger will show a receipt immediately.
                </p>
              </div>
            ) : routedItems.length === 0 ? (
              <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
                <p className="font-bold">No public-safe items in this lane yet.</p>
                <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
                  Switch lanes or submit a new lead with a date, place, name, or source file.
                </p>
              </div>
            ) : (
              routedItems.map(({ item, plan }) => (
                <IntakeCard key={item.id} item={item} plan={plan} />
              ))
            )}
          </div>

          <aside className="space-y-3 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
              <p className="text-xs font-bold uppercase tracking-normal text-[var(--color-success)]">
                How this works
              </p>
              <ol className="mt-3 space-y-3 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                <li>
                  <strong className="text-[var(--color-ink)]">1. Received:</strong>{" "}
                  the site logs a public-safe receipt.
                </li>
                <li>
                  <strong className="text-[var(--color-ink)]">2. Connected:</strong>{" "}
                  people add documents, dates, links, corrections, and related records.
                </li>
                <li>
                  <strong className="text-[var(--color-ink)]">3. Mapped:</strong>{" "}
                  Ryan connects useful information into a case file, timeline,
                  profile, or source map.
                </li>
              </ol>
            </div>
            <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] p-4">
              <p className="text-xs font-bold uppercase tracking-normal text-[var(--color-accent)]">
                Privacy line
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                This page does not publish private messages, emails, phone
                numbers, uploaded evidence URLs, sealed material, or raw
                narratives. It shows that action happened and lets the public
                help build the record safely.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </article>
  );
}

function IntakeCard({
  item,
  plan,
}: {
  item: IntakeItem;
  plan: IntakeRoutePlan;
}) {
  const status = statusCopy[item.public_status] ?? statusCopy.received;
  const tags = (item.clue_tags ?? []).filter(Boolean).slice(0, 5);
  const route = publicRouteCopy[plan.kind];
  return (
    <article className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-[var(--color-line)] bg-[var(--color-paper)] px-2.5 py-1 font-mono text-xs font-bold text-[var(--color-ink)]">
              {item.public_ref}
            </span>
            <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${status.cls}`}>
              {status.label}
            </span>
          </div>
          <h2 className="mt-3 font-display text-2xl font-bold leading-tight tracking-normal">
            {item.subject || humanize(item.category)}
          </h2>
          <p className="mt-1 text-xs font-bold uppercase tracking-normal text-[var(--color-muted)]">
            {humanize(item.source_type)} · {humanize(item.category)}
            {item.location ? ` · ${item.location}` : ""}
          </p>
        </div>
        <p className="text-right text-xs text-[var(--color-muted)]">
          {formatDistanceToNowStrict(new Date(item.last_action_at), {
            addSuffix: true,
          })}
        </p>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-[var(--color-ink-soft)]">
        {item.public_summary}
      </p>

      <section className="mt-3 border border-[var(--color-line)] bg-[var(--color-paper)] p-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-muted)]">
              Moving toward
            </p>
            <h3 className="mt-1 font-sans text-lg font-black">
              {route.label}
            </h3>
          </div>
          <span className={routeBadgeClass(plan.urgency)}>
            {plan.urgency}
          </span>
        </div>
        <p className="mt-2 text-sm font-semibold leading-6 text-[var(--color-ink-soft)]">
          {route.helper}
        </p>
        <p className="mt-2 border-l-4 border-[var(--color-support)] pl-3 text-xs font-bold leading-5 text-[var(--color-ink-soft)]">
          {route.ask}
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {plan.nextActions.slice(0, 2).map((action) => (
            <p
              key={action}
              className="border border-[var(--color-line)] bg-[var(--color-surface)] p-2 text-xs font-semibold leading-5 text-[var(--color-ink-soft)]"
            >
              {action}
            </p>
          ))}
        </div>
      </section>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MiniStat label="Verified" value={item.verify_count} tone="green" />
        <MiniStat label="Connected" value={item.connection_count} tone="gold" />
        <MiniStat label="Disputed" value={item.dispute_count} tone="red" />
        <MiniStat label="Context" value={item.context_count} tone="blue" />
      </div>

      {tags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-[var(--color-paper)] px-2 py-1 text-[11px] font-bold uppercase tracking-normal text-[var(--color-muted)]"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      <IntakeSignalForm itemId={item.id} publicRef={item.public_ref} />
    </article>
  );
}

function LaneStat({
  label,
  value,
  href,
  active,
}: {
  label: string;
  value: number;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        "border p-3 transition",
        active
          ? "border-[#7fe3a9] bg-[#7fe3a9]/15"
          : "border-white/10 bg-white/[0.055] hover:border-[#7fe3a9]/50 hover:bg-[#7fe3a9]/10",
      ].join(" ")}
    >
      <p className="font-sans text-2xl font-black text-[#fdf8ea]">
        {value}
      </p>
      <p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#cfd9ea]">
        {label}
      </p>
    </Link>
  );
}

function routeBadgeClass(urgency: IntakeRoutePlan["urgency"]) {
  const base = "px-2 py-1 text-[10px] font-black uppercase tracking-normal";
  if (urgency === "hot") return `${base} bg-[var(--color-accent)] text-white`;
  if (urgency === "next") return `${base} bg-[var(--color-support)] text-[#1a1410]`;
  return `${base} bg-[var(--color-surface-2)] text-[var(--color-ink-soft)]`;
}

function Stat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "neutral" | "red";
}) {
  return (
    <div
      className={[
        "rounded-lg border p-4",
        tone === "red"
          ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)]"
          : "border-[var(--color-line)] bg-[var(--color-surface)]",
      ].join(" ")}
    >
      <p className="font-mono text-3xl font-black leading-none">{value.toLocaleString()}</p>
      <p className="mt-1 text-[11px] font-bold uppercase tracking-normal text-[var(--color-muted)]">
        {label}
      </p>
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "green" | "gold" | "red" | "blue";
}) {
  const cls =
    tone === "green"
      ? "border-[var(--color-success)] bg-[var(--color-success-soft)]"
      : tone === "gold"
        ? "border-[var(--color-support)] bg-[var(--color-support-soft)]"
      : tone === "red"
        ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)]"
        : "border-[var(--color-blue)] bg-[var(--color-blue-soft)]";
  return (
    <div className={`rounded-lg border px-3 py-2 ${cls}`}>
      <p className="font-mono text-xl font-black leading-none">{value}</p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-normal text-[var(--color-muted)]">
        {label}
      </p>
    </div>
  );
}

function humanize(value: string) {
  if (value === "private_message") return "Private Receipt";
  if (value === "service_question") return "Service Question";
  return value.replace(/[_-]/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function isRouteKind(value: string | undefined): value is IntakeRouteKind {
  return routeOrder.includes(value as IntakeRouteKind);
}

function intakeHref(filter: string, route: IntakeRouteKind | null) {
  const params = new URLSearchParams();
  if (filter !== "all") params.set("filter", filter);
  if (route) params.set("route", route);
  const query = params.toString();
  return query ? `/case/intake?${query}` : "/case/intake";
}
