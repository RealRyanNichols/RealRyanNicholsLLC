import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { format, formatDistanceToNowStrict } from "date-fns";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { ImportReviewRow } from "@/components/ImportReviewRow";

export const metadata: Metadata = {
  title: "Imports",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Filter = "pending" | "approved" | "rejected" | "all";
type Theme =
  | "all"
  | "entrapment"
  | "excessive_force"
  | "death_or_injury"
  | "police_misconduct"
  | "government_lies"
  | "contradiction"
  | "due_process"
  | "abuse_in_custody";

const THEMES: { value: Theme; label: string }[] = [
  { value: "all", label: "All themes" },
  { value: "entrapment", label: "🪤 Entrapment" },
  { value: "excessive_force", label: "💥 Excessive force" },
  { value: "death_or_injury", label: "🏥 Death / injury" },
  { value: "police_misconduct", label: "🚓 Police misconduct" },
  { value: "government_lies", label: "🤥 Govt. lies" },
  { value: "contradiction", label: "🔁 Contradictions" },
  { value: "due_process", label: "⚖️ Due process" },
  { value: "abuse_in_custody", label: "🔒 Abuse in custody" },
];

export default async function AdminImportsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; theme?: string }>;
}) {
  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=/admin/imports");
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

  const sp = await searchParams;
  const filter: Filter =
    sp.filter === "approved" ||
    sp.filter === "rejected" ||
    sp.filter === "all"
      ? sp.filter
      : "pending";
  const theme: Theme =
    (THEMES.find((t) => t.value === sp.theme)?.value as Theme) ?? "all";

  let query = supabase
    .from("pending_imports")
    .select(
      `id, source, source_url, title, description, doc_type, document_date,
       external_url, source_label, review_status, evidence_themes,
       importance_score, match_confidence, created_at,
       person:case_people!person_id (id, slug, name)`,
    )
    .order("importance_score", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);

  if (filter !== "all") query = query.eq("review_status", filter);
  if (theme !== "all") query = query.contains("evidence_themes", [theme]);

  const [{ data: rows }, counts, latestRun] = await Promise.all([
    query,
    supabase.rpc("imports_status_counts").then((r) => r.data ?? null),
    supabase
      .from("import_runs")
      .select(
        "id, status, started_at, finished_at, people_processed, people_total, documents_found, documents_skipped, errors_count, cursor_person_slug",
      )
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const buckets = (counts ?? {}) as {
    pending?: number;
    approved?: number;
    rejected?: number;
  };

  return (
    <article className="mx-auto max-w-5xl px-4 py-10">
      <p className="text-xs uppercase tracking-wider text-[var(--color-accent)] font-bold">
        Admin · evidence imports
      </p>
      <div className="flex flex-wrap items-baseline justify-between gap-3 mt-2">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Import review
        </h1>
        <p className="text-xs text-[var(--color-muted)]">
          Sorted by importance — entrapment, force, lies, contradictions first.
        </p>
      </div>

      {latestRun.data ? (
        <section className="mt-5 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 text-sm">
          <p className="text-xs uppercase tracking-wider text-[var(--color-muted)] font-bold">
            Latest run · {latestRun.data.status}
          </p>
          <p className="mt-1">
            {latestRun.data.people_processed ?? 0} /{" "}
            {latestRun.data.people_total ?? 0} defendants ·{" "}
            <strong>{latestRun.data.documents_found ?? 0}</strong> new docs ·{" "}
            {latestRun.data.documents_skipped ?? 0} dupes ·{" "}
            {latestRun.data.errors_count ?? 0} errors
          </p>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            Started{" "}
            {formatDistanceToNowStrict(new Date(latestRun.data.started_at), {
              addSuffix: true,
            })}
            {latestRun.data.cursor_person_slug ? (
              <>
                {" "}
                · Last:{" "}
                <span className="font-mono">
                  {latestRun.data.cursor_person_slug}
                </span>
              </>
            ) : null}
          </p>
        </section>
      ) : null}

      <nav className="mt-6 flex flex-wrap gap-1 border-b border-[var(--color-line)]">
        {(
          [
            ["pending", `Pending (${buckets.pending ?? 0})`],
            ["approved", `Approved (${buckets.approved ?? 0})`],
            ["rejected", `Rejected (${buckets.rejected ?? 0})`],
            ["all", "All"],
          ] as const
        ).map(([f, label]) => (
          <TabLink
            key={f}
            active={filter === f}
            href={`/admin/imports?filter=${f}${theme !== "all" ? `&theme=${theme}` : ""}`}
          >
            {label}
          </TabLink>
        ))}
      </nav>

      <div className="mt-4 flex flex-wrap gap-2">
        {THEMES.map((t) => (
          <Link
            key={t.value}
            href={`/admin/imports?filter=${filter}${t.value !== "all" ? `&theme=${t.value}` : ""}`}
            className={[
              "rounded-full border px-3 py-1 text-xs font-bold transition",
              theme === t.value
                ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-paper)]"
                : "border-[var(--color-line)] text-[var(--color-ink)] hover:border-[var(--color-accent)]",
            ].join(" ")}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {!rows || rows.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)] italic py-12 text-center">
            Nothing here. {filter === "pending" ? "Run the importer to fill the queue." : null}
          </p>
        ) : (
          rows.map((r) => {
            const person = Array.isArray(r.person) ? r.person[0] : r.person;
            return (
              <ImportReviewRow
                key={r.id}
                id={r.id}
                title={r.title}
                description={r.description}
                docType={r.doc_type}
                documentDate={r.document_date}
                externalUrl={r.external_url}
                sourceLabel={r.source_label}
                reviewStatus={r.review_status}
                evidenceThemes={r.evidence_themes ?? []}
                importanceScore={r.importance_score ?? 0}
                matchConfidence={r.match_confidence}
                createdAt={r.created_at}
                createdAtRelative={formatDistanceToNowStrict(new Date(r.created_at), { addSuffix: true })}
                createdAtAbsolute={format(new Date(r.created_at), "MMM d, yyyy h:mma")}
                person={person ? { id: person.id, slug: person.slug, name: person.name } : null}
              />
            );
          })
        )}
      </div>

      <p className="mt-10 text-xs text-[var(--color-muted)]">
        <Link href="/admin" className="underline">
          ← Admin dashboard
        </Link>
      </p>
    </article>
  );
}

function TabLink({
  active,
  href,
  children,
}: {
  active: boolean;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={[
        "px-4 py-2.5 -mb-px border-b-2 text-sm font-semibold transition",
        active
          ? "border-[var(--color-accent)] text-[var(--color-ink)]"
          : "border-transparent text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}
