import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { STORY_CHAPTERS, getStoryChapter } from "@/lib/story";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbLd, personRef, websiteRef } from "@/lib/jsonld";
import { ShareButton } from "@/components/ShareButton";
import { SITE } from "@/lib/site";

export const revalidate = 3600;

export function generateStaticParams() {
  return STORY_CHAPTERS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const c = getStoryChapter(slug);
  if (!c) return { title: "Not found" };
  const title = `${c.title} (${c.year}) — Ryan Nichols rescue record`;
  const description = `${c.detail} Part of the documented search-and-rescue record of Ryan Nichols (Exhibit 288, United States v. Nichols).`;
  const url = `${SITE.url}/story/${c.slug}`;
  return {
    title: `${c.title} (${c.year})`,
    description,
    alternates: { canonical: url },
    openGraph: { type: "article", title, description, url },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function StoryChapterPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const c = getStoryChapter(slug);
  if (!c) notFound();
  const url = `${SITE.url}/story/${c.slug}`;

  const idx = STORY_CHAPTERS.findIndex((x) => x.slug === c.slug);
  const prev = idx > 0 ? STORY_CHAPTERS[idx - 1] : null;
  const next = idx < STORY_CHAPTERS.length - 1 ? STORY_CHAPTERS[idx + 1] : null;

  const ld = [
    {
      "@context": "https://schema.org",
      "@type": "Event",
      "@id": `${url}#event`,
      name: `${c.title} — Ryan Nichols search-and-rescue deployment`,
      startDate: c.year,
      description: c.detail,
      url,
      isPartOf: websiteRef(),
      performer: personRef(),
    },
    breadcrumbLd([
      { name: "The Case", url: `${SITE.url}/case` },
      { name: "The rescue record", url: `${SITE.url}/about` },
      { name: `${c.title} (${c.year})`, url },
    ]),
  ];

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <JsonLd data={ld} />

      <nav className="mb-4 text-sm text-[var(--color-muted)]">
        <Link href="/case" className="hover:underline">
          ← The case
        </Link>{" "}
        ·{" "}
        <Link href="/about" className="hover:underline">
          The full record
        </Link>
      </nav>

      <p className="text-[11px] uppercase tracking-[0.25em] font-bold text-[var(--color-navy)]">
        The rescue record · chapter {idx + 1} of {STORY_CHAPTERS.length}
      </p>
      <div className="mt-2 flex flex-wrap items-baseline gap-3">
        <span className="rounded bg-[var(--color-ink)] px-2 py-1 text-sm font-bold tabular-nums text-[var(--color-paper)]">
          {c.year}
        </span>
        <h1 className="font-display text-4xl sm:text-6xl font-bold tracking-tight leading-[1.02]">
          {c.title}
        </h1>
      </div>

      {c.context ? (
        <p className="mt-6 text-lg sm:text-xl leading-relaxed text-[var(--color-ink-soft)]">
          {c.context}
        </p>
      ) : null}

      <section className="mt-8 rounded-2xl border-2 border-[var(--color-line)] bg-[var(--color-surface)] p-5 sm:p-6">
        <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-[var(--color-navy)]">
          How Ryan was involved · from the record
        </p>
        <p className="mt-2 text-base sm:text-lg leading-relaxed text-[var(--color-ink)]">
          {c.involvement}
        </p>
        <p className="mt-3 text-xs text-[var(--color-muted)]">
          Source: the biography filed as Exhibit 288 in United States v.
          Nichols —{" "}
          <Link href="/about" className="font-bold text-[var(--color-navy)] hover:underline">
            read it in full →
          </Link>
        </p>
      </section>

      {c.significance ? (
        <section className="mt-6 rounded-2xl bg-[var(--color-ink)] p-6 text-[var(--color-paper)]">
          <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-[var(--color-accent)]">
            Why it matters
          </p>
          <p className="mt-2 font-display text-lg sm:text-xl font-bold leading-snug">
            {c.significance}
          </p>
        </section>
      ) : null}

      {c.recognition && c.recognition.length > 0 ? (
        <section className="mt-6 rounded-2xl border-2 border-[var(--color-blue)]/40 bg-[var(--color-blue-soft)]/50 p-5">
          <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-[var(--color-blue)]">
            Recognized
          </p>
          {c.recognition.map((r) => (
            <p key={r.outlet} className="mt-2 text-sm leading-relaxed text-[var(--color-ink)]">
              <strong>{r.outlet}</strong> — {r.note}
            </p>
          ))}
        </section>
      ) : null}

      {/* Media — fills as the archive digitizes each deployment. */}
      <section className="mt-8">
        <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-[var(--color-muted)]">
          Pictures & footage
        </p>
        {c.media.length > 0 ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {c.media.map((m) => (
              // eslint-disable-next-line @next/next/no-img-element
              <figure key={m.src}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={m.src}
                  alt={m.alt}
                  className="w-full rounded-xl border border-[var(--color-line)] object-cover"
                  loading="lazy"
                />
                {m.caption ? (
                  <figcaption className="mt-1 text-xs text-[var(--color-muted)]">
                    {m.caption}
                  </figcaption>
                ) : null}
              </figure>
            ))}
          </div>
        ) : (
          <div className="mt-3 rounded-2xl border border-dashed border-[var(--color-line)] bg-[var(--color-paper)] p-5">
            <p className="text-sm text-[var(--color-ink-soft)]">
              Photos and footage from this deployment are being added from the
              archive.{" "}
              <strong className="text-[var(--color-ink)]">
                Were you there — rescued, rescuing, or watching?
              </strong>{" "}
              Your pictures and video belong in this record.
            </p>
            <Link
              href="/submit"
              className="mt-3 inline-flex items-center rounded-lg bg-[var(--color-navy)] px-4 py-2 text-sm font-bold text-[#fdf8ea] transition hover:bg-[var(--color-blue)]"
            >
              Send what you have →
            </Link>
          </div>
        )}
      </section>

      {/* Share + timeline walk */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <ShareButton
          url={url}
          title={`${c.title} (${c.year}) — a chapter in the documented rescue record of Ryan Nichols:`}
          slug={c.slug}
          caseKind="person"
          compact
        />
        <Link
          href="/case"
          className="text-sm font-bold text-[var(--color-navy)] hover:underline"
        >
          The whole story, start to finish →
        </Link>
      </div>

      <nav className="mt-8 grid gap-3 border-t-2 border-[var(--color-line)] pt-6 sm:grid-cols-2">
        {prev ? (
          <Link
            href={`/story/${prev.slug}`}
            className="rounded-2xl border-2 border-[var(--color-line)] bg-[var(--color-surface)] p-4 transition hover:border-[var(--color-navy)]"
          >
            <p className="text-[10px] uppercase tracking-wider font-bold text-[var(--color-muted)]">
              ← Before this
            </p>
            <p className="mt-1 font-display text-lg font-bold">
              {prev.title} ({prev.year})
            </p>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/story/${next.slug}`}
            className="rounded-2xl border-2 border-[var(--color-line)] bg-[var(--color-surface)] p-4 text-right transition hover:border-[var(--color-navy)]"
          >
            <p className="text-[10px] uppercase tracking-wider font-bold text-[var(--color-muted)]">
              What came next →
            </p>
            <p className="mt-1 font-display text-lg font-bold">
              {next.title} ({next.year})
            </p>
          </Link>
        ) : null}
      </nav>
    </article>
  );
}
