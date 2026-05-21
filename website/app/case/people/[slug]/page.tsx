import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getPeople, getPersonBySlug, getDocumentsForPerson } from "@/lib/case";
import { ShareButton } from "@/components/ShareButton";
import { CaseStats } from "@/components/CaseStats";
import { CaseViewTracker } from "@/components/CaseViewTracker";
import { EvidenceGrid } from "@/components/EvidenceGrid";
import { SITE } from "@/lib/site";

export const revalidate = 300;

export async function generateStaticParams() {
  const list = await getPeople();
  return list.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = await getPersonBySlug(slug);
  if (!p) return { title: "Not found" };
  const url = `${SITE.url}/case/people/${p.slug}`;
  const title = `${p.name} · ${p.role ?? "person of record"}`;
  return {
    title,
    description: p.description ?? `Person of record in United States v. Nichols.`,
    openGraph: {
      type: "article",
      title,
      description: p.description ?? undefined,
      url,
    },
    twitter: { card: "summary_large_image", title, description: p.description ?? undefined },
    alternates: { canonical: url },
  };
}

export default async function PersonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = await getPersonBySlug(slug);
  if (!p) notFound();
  const url = `${SITE.url}/case/people/${p.slug}`;
  const evidence = await getDocumentsForPerson(p.id);

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <CaseViewTracker type="person" slug={p.slug} />

      <nav className="text-sm text-[var(--color-muted)] mb-4">
        <Link href="/case" className="hover:underline">
          ← J6 Case
        </Link>{" "}
        ·{" "}
        <Link href="/case?view=people" className="hover:underline">
          All people
        </Link>
      </nav>

      <p className="text-xs uppercase tracking-wider text-[var(--color-accent)] font-bold">
        Person of record
      </p>
      <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight">
        {p.name}
      </h1>
      {p.role ? (
        <p className="mt-1 text-base font-medium text-[var(--color-accent)]">
          {p.role}
          {p.agency ? ` · ${p.agency}` : ""}
        </p>
      ) : null}

      {p.description ? (
        <p className="mt-6 text-base sm:text-lg text-[var(--color-ink-soft)] leading-relaxed whitespace-pre-wrap">
          {p.description}
        </p>
      ) : null}

      <div className="mt-8 flex items-center gap-3">
        <ShareButton url={url} title={`${p.name} — United States v. Nichols`} slug={p.slug} caseKind="person" />
      </div>

      <div className="mt-4">
        <CaseStats views={p.views_count} shares={p.shares_count} />
      </div>

      <section className="mt-12 border-t border-[var(--color-line)] pt-8">
        <div className="border-l-2 border-[var(--color-accent)] pl-4 mb-5">
          <p className="text-[10px] uppercase tracking-wider text-[var(--color-accent)] font-bold">
            Evidence on file
          </p>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight">
            {evidence.length === 0
              ? "No scans linked yet"
              : `${evidence.length} ${evidence.length === 1 ? "document" : "documents"} on file`}
          </h2>
        </div>
        <EvidenceGrid documents={evidence} />
      </section>

      <div className="mt-10 border-t border-[var(--color-line)] pt-6 text-sm text-[var(--color-ink-soft)]">
        <Link href="/support" className="text-[var(--color-accent)] underline font-semibold">
          Support Ryan&apos;s rebuild
        </Link>{" "}
        — every dollar funds keeping this record public.
      </div>
    </article>
  );
}
