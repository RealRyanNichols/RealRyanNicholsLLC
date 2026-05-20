import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { ScanCurator } from "@/components/ScanCurator";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Curate case scans",
  robots: { index: false, follow: false },
};

type DocRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  doc_type: string;
  document_date: string | null;
  external_url: string | null;
  file_url: string | null;
  relevance: number;
  transcript: string | null;
  archived: boolean;
  archived_reason: string | null;
  curated_at: string | null;
};

const COLS =
  "id, slug, title, description, doc_type, document_date, external_url, file_url, relevance, transcript, archived, archived_reason, curated_at";

export default async function AdminCaseScansPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string; filter?: string }>;
}) {
  const { slug, filter } = await searchParams;
  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=/admin/case/scans");
  const { data: adminCheck } = await supabase.rpc("is_admin", { uid: auth.user.id });
  if (adminCheck !== true) {
    return (
      <article className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Not authorized</h1>
      </article>
    );
  }

  let query = supabase.from("case_documents").select(COLS);
  if (filter === "uncurated") query = query.is("curated_at", null);
  if (filter === "archived") query = query.eq("archived", true);
  if (filter === "curated") query = query.not("curated_at", "is", null);
  const { data: docs } = await query
    .order("slug", { ascending: true })
    .returns<DocRow[]>();
  const list = docs ?? [];

  const totals = {
    all: list.length,
  };

  if (slug) {
    const idx = list.findIndex((d) => d.slug === slug);
    const doc = idx >= 0 ? list[idx] : null;
    if (!doc) {
      return (
        <article className="mx-auto max-w-md px-4 py-16 text-center">
          <h1 className="text-2xl font-semibold">Not found</h1>
          <p className="mt-3">
            <Link href="/admin/case/scans" className="text-[var(--color-accent)] underline">
              ← Back to list
            </Link>
          </p>
        </article>
      );
    }
    const prev = idx > 0 ? list[idx - 1].slug : null;
    const next = idx < list.length - 1 ? list[idx + 1].slug : null;
    return (
      <article className="mx-auto max-w-6xl px-4 py-8">
        <p className="text-xs uppercase tracking-wider text-[var(--color-accent)] font-bold">
          Curator
        </p>
        <div className="flex items-baseline justify-between gap-4 flex-wrap">
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{doc.slug}</h1>
          <Link href="/admin/case/scans" className="text-sm underline text-[var(--color-accent)]">
            ← All scans
          </Link>
        </div>
        <p className="mt-1 text-xs text-[var(--color-muted)]">
          {idx + 1} of {list.length} in this filter
        </p>
        <div className="mt-6">
          <ScanCurator doc={doc} nextSlug={next} prevSlug={prev} />
        </div>
      </article>
    );
  }

  const counts = await Promise.all([
    supabase.from("case_documents").select("id", { count: "exact", head: true }),
    supabase.from("case_documents").select("id", { count: "exact", head: true }).is("curated_at", null),
    supabase.from("case_documents").select("id", { count: "exact", head: true }).not("curated_at", "is", null),
    supabase.from("case_documents").select("id", { count: "exact", head: true }).eq("archived", true),
  ]);
  const total = counts[0].count ?? 0;
  const uncurated = counts[1].count ?? 0;
  const curated = counts[2].count ?? 0;
  const archived = counts[3].count ?? 0;
  const firstUncurated = list.find((d) => !d.curated_at)?.slug ?? null;

  return (
    <article className="mx-auto max-w-5xl px-4 py-8">
      <p className="text-xs uppercase tracking-wider text-[var(--color-accent)] font-bold">
        Curator
      </p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">Case scans</h1>
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <Stat label="Total" value={total} href="/admin/case/scans" active={!filter} />
        <Stat label="Uncurated" value={uncurated} href="/admin/case/scans?filter=uncurated" active={filter === "uncurated"} />
        <Stat label="Curated" value={curated} href="/admin/case/scans?filter=curated" active={filter === "curated"} />
        <Stat label="Archived" value={archived} href="/admin/case/scans?filter=archived" active={filter === "archived"} />
      </div>
      {firstUncurated ? (
        <div className="mt-6">
          <Link
            href={`/admin/case/scans?slug=${firstUncurated}&filter=${filter ?? "uncurated"}`}
            className="btn-accent inline-flex items-center rounded-full px-5 py-2.5 text-sm font-bold"
          >
            Start curating uncurated batch →
          </Link>
        </div>
      ) : null}

      <ul className="mt-6 divide-y divide-[var(--color-line)] rounded-xl border border-[var(--color-line)]">
        {list.slice(0, 200).map((d) => (
          <li key={d.slug} className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-surface)]">
            <Link
              href={`/admin/case/scans?slug=${d.slug}${filter ? `&filter=${filter}` : ""}`}
              className="flex-1 min-w-0"
            >
              <div className="text-sm font-mono text-[var(--color-muted)]">{d.slug}</div>
              <div className="text-sm font-semibold truncate">{d.title}</div>
              <div className="text-xs text-[var(--color-muted)]">
                {d.document_date ?? "no date"} · {d.doc_type}
                {d.archived ? " · archived" : ""}
                {d.curated_at ? " · curated" : ""}
              </div>
            </Link>
            <span className="text-xs text-[var(--color-muted)]">★{d.relevance}</span>
          </li>
        ))}
      </ul>
      {list.length > 200 ? (
        <p className="mt-4 text-xs text-[var(--color-muted)]">
          Showing first 200 of {totals.all}. Use filters to narrow.
        </p>
      ) : null}
    </article>
  );
}

function Stat({ label, value, href, active }: { label: string; value: number; href: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={[
        "rounded-xl border px-4 py-3 transition",
        active
          ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)]"
          : "border-[var(--color-line)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]",
      ].join(" ")}
    >
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-semibold">
        {label}
      </div>
    </Link>
  );
}
