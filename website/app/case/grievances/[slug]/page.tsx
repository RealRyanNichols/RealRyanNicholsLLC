import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getGrievanceBySlug, getGrievances, getCaseCommentsCount } from "@/lib/case";
import { ShareButton } from "@/components/ShareButton";
import { CaseStats } from "@/components/CaseStats";
import { CaseViewTracker } from "@/components/CaseViewTracker";
import { CaseCommentList } from "@/components/CaseCommentList";
import { CaseCommentForm } from "@/components/CaseCommentForm";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { SITE } from "@/lib/site";

export const revalidate = 300;

export async function generateStaticParams() {
  const list = await getGrievances();
  return list.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const g = await getGrievanceBySlug(slug);
  if (!g) return { title: "Not found" };
  const url = `${SITE.url}/case/grievances/${g.slug}`;
  const description = g.summary ?? `Grievance #${g.display_order}: ${g.title}`;
  return {
    title: `${g.title} · Grievance #${g.display_order}`,
    description,
    openGraph: {
      type: "article",
      title: `${g.title} — United States v. Nichols`,
      description,
      url,
    },
    twitter: { card: "summary_large_image", title: g.title, description },
    alternates: { canonical: url },
  };
}

export default async function GrievancePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const g = await getGrievanceBySlug(slug);
  if (!g) notFound();
  const url = `${SITE.url}/case/grievances/${g.slug}`;

  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  const commentCount = await getCaseCommentsCount("grievance", g.id);

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <CaseViewTracker type="grievance" slug={g.slug} />

      <nav className="text-sm text-[var(--color-muted)] mb-4">
        <Link href="/case" className="hover:underline">
          ← The Case
        </Link>{" "}
        ·{" "}
        <Link href="/case?view=grievances" className="hover:underline">
          All grievances
        </Link>
      </nav>

      <div className="flex items-center gap-2 mb-3">
        <span className="rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)] px-2 py-0.5 text-xs font-bold uppercase tracking-wider">
          Grievance #{g.display_order}
        </span>
        {g.category ? (
          <span className="text-xs uppercase tracking-wider text-[var(--color-muted)] font-semibold">
            {g.category}
          </span>
        ) : null}
        <span className="text-xs text-[var(--color-muted)]">·</span>
        <SeverityDots severity={g.severity} />
      </div>

      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-[1.1]">
        {g.title}
      </h1>

      {g.summary ? (
        <p className="mt-4 text-base sm:text-lg text-[var(--color-ink-soft)] leading-relaxed">
          {g.summary}
        </p>
      ) : null}

      <div className="mt-6 flex items-center gap-4 text-sm flex-wrap">
        <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3">
          <div className="text-2xl font-bold">{g.count}</div>
          <div className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-semibold">
            filings
          </div>
        </div>
        <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3">
          <div className="text-2xl font-bold">{g.severity}/5</div>
          <div className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-semibold">
            severity
          </div>
        </div>
        <ShareButton url={url} title={`${g.title} — United States v. Nichols`} slug={g.slug} caseKind="grievance" />
      </div>

      <div className="mt-4">
        <CaseStats
          views={g.views_count}
          shares={g.shares_count}
          comments={commentCount}
        />
      </div>

      {g.body ? (
        <div className="prose-body mt-8 whitespace-pre-wrap">{g.body}</div>
      ) : (
        <p className="mt-8 text-sm text-[var(--color-muted)] italic">
          Full write-up pending. Cross-referenced documents will appear here.
        </p>
      )}

      <section className="mt-12 border-t border-[var(--color-line)] pt-8">
        <h2 className="text-xs uppercase tracking-wider text-[var(--color-muted)] font-bold">
          Discussion
        </h2>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          Comments here become part of the public record. Moderated.
        </p>
        <div className="mt-5">
          <CaseCommentList type="grievance" id={g.id} />
        </div>
        <div className="mt-6">
          <CaseCommentForm type="grievance" slug={g.slug} signedIn={!!auth.user} />
        </div>
      </section>

      <div className="mt-10 border-t border-[var(--color-line)] pt-6 text-sm text-[var(--color-ink-soft)]">
        Help keep this case visible.{" "}
        <Link href="/support" className="text-[var(--color-accent)] underline font-semibold">
          Support Ryan&apos;s rebuild
        </Link>
        .
      </div>
    </article>
  );
}

function SeverityDots({ severity }: { severity: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`Severity ${severity} of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={[
            "h-1.5 w-1.5 rounded-full",
            i <= severity ? "bg-[var(--color-accent)]" : "bg-[var(--color-line)]",
          ].join(" ")}
        />
      ))}
    </span>
  );
}
