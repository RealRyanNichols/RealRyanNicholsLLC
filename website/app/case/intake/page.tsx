import type { Metadata } from "next";
import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";
import { IntakeSignalForm } from "@/components/IntakeSignalForm";
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
  source_type: "tip" | "submission";
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

type Search = { filter?: string };

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
  { value: "needs_verification", label: "Needs verification" },
  { value: "verified", label: "Verified" },
];

export default async function IntakeLedgerPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const filter = sp.filter ?? "all";

  let items: IntakeItem[] = [];
  let counts = {
    total: 0,
    tips: 0,
    submissions: 0,
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

    if (filter === "tip" || filter === "submission") {
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

    const [{ count: total }, { count: tips }, { count: submissions }, { count: open }] =
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
          .in("public_status", ["received", "needs_verification", "triage"]),
      ]);

    counts = {
      total: total ?? 0,
      tips: tips ?? 0,
      submissions: submissions ?? 0,
      open: open ?? 0,
      signals: items.reduce(
        (sum, item) => sum + item.verify_count + item.dispute_count + item.context_count,
        0,
      ),
    };
  } else {
    error = "Supabase is not configured.";
  }

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
              help verify, dispute, or connect the lead to another case,
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
          </div>
        </div>
      </section>

      <section className="rrn-section">
        <nav className="flex gap-2 overflow-x-auto border-b border-[var(--color-line)] pb-3">
          {filterOptions.map((option) => (
            <Link
              key={option.value}
              href={option.value === "all" ? "/case/intake" : `/case/intake?filter=${option.value}`}
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
            ) : (
              items.map((item) => <IntakeCard key={item.id} item={item} />)
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
                  <strong className="text-[var(--color-ink)]">2. Verified:</strong>{" "}
                  people add documents, dates, links, or corrections.
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

function IntakeCard({ item }: { item: IntakeItem }) {
  const status = statusCopy[item.public_status] ?? statusCopy.received;
  const tags = (item.clue_tags ?? []).filter(Boolean).slice(0, 5);
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

      <div className="mt-3 grid grid-cols-3 gap-2">
        <MiniStat label="Verified" value={item.verify_count} tone="green" />
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
  tone: "green" | "red" | "blue";
}) {
  const cls =
    tone === "green"
      ? "border-[var(--color-success)] bg-[var(--color-success-soft)]"
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
  return value.replace(/[_-]/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}
