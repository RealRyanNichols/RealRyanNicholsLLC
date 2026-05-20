import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { getEventBySlug, getEvents, getCaseCommentsCount } from "@/lib/case";
import { ShareButton } from "@/components/ShareButton";
import { CaseStats } from "@/components/CaseStats";
import { CaseViewTracker } from "@/components/CaseViewTracker";
import { CaseCommentList } from "@/components/CaseCommentList";
import { CaseCommentForm } from "@/components/CaseCommentForm";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { SITE } from "@/lib/site";

export const revalidate = 300;

export async function generateStaticParams() {
  const list = await getEvents();
  return list.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const e = await getEventBySlug(slug);
  if (!e) return { title: "Not found" };
  const url = `${SITE.url}/case/events/${e.slug}`;
  const description = e.description ?? `${e.title} — ${format(new Date(e.event_date), "MMMM d, yyyy")}`;
  return {
    title: `${e.title} · Timeline`,
    description,
    openGraph: { type: "article", title: e.title, description, url },
    twitter: { card: "summary_large_image", title: e.title, description },
    alternates: { canonical: url },
  };
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const e = await getEventBySlug(slug);
  if (!e) notFound();
  const url = `${SITE.url}/case/events/${e.slug}`;

  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  const commentCount = await getCaseCommentsCount("event", e.id);

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <CaseViewTracker type="event" slug={e.slug} />

      <nav className="text-sm text-[var(--color-muted)] mb-4">
        <Link href="/case" className="hover:underline">
          ← The Case
        </Link>{" "}
        ·{" "}
        <Link href="/case?view=timeline" className="hover:underline">
          Timeline
        </Link>
      </nav>

      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)] px-2 py-0.5 text-xs font-bold uppercase tracking-wider">
          Event
        </span>
        <span className="text-xs text-[var(--color-muted)] font-semibold">
          {format(new Date(e.event_date), "MMMM d, yyyy")}
        </span>
        {e.location ? (
          <span className="text-xs text-[var(--color-muted)]">
            · {e.location}
          </span>
        ) : null}
      </div>

      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-[1.1]">
        {e.title}
      </h1>

      {e.description ? (
        <p className="mt-4 text-base sm:text-lg text-[var(--color-ink-soft)] leading-relaxed whitespace-pre-wrap">
          {e.description}
        </p>
      ) : null}

      <div className="mt-6 flex items-center gap-4 flex-wrap">
        <ShareButton url={url} title={e.title} slug={e.slug} caseKind="event" />
      </div>

      <div className="mt-4">
        <CaseStats
          views={e.views_count}
          shares={e.shares_count}
          comments={commentCount}
        />
      </div>

      <section className="mt-12 border-t border-[var(--color-line)] pt-8">
        <h2 className="text-xs uppercase tracking-wider text-[var(--color-muted)] font-bold">
          Discussion
        </h2>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          Comments here become part of the public record. Moderated.
        </p>
        <div className="mt-5">
          <CaseCommentList type="event" id={e.id} />
        </div>
        <div className="mt-6">
          <CaseCommentForm type="event" slug={e.slug} signedIn={!!auth.user} />
        </div>
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
