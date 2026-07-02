import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { getOgImage } from "@/lib/og-images";
import { getFight, FIGHTS } from "@/lib/fights";
import { getPostBySlug } from "@/lib/posts";
import { ShareRail } from "@/components/ShareRail";
import { ReactionBar } from "@/components/ReactionBar";
import { TweetEmbed } from "@/components/TweetEmbed";

export const revalidate = 600;

export function generateStaticParams() {
  return FIGHTS.map((f) => ({ slug: f.slug }));
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const fight = getFight(slug);
  if (!fight) return { title: "Not found" };

  const override = await getOgImage(`/fights/${slug}`);
  const title = override?.title ?? `${fight.title} — The Fights`;
  const description = override?.description ?? fight.lede;
  const url = `${SITE.url}/fights/${slug}`;
  const ogImageUrl = override?.image_url ?? null;

  return {
    title: override?.title ?? fight.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title,
      description,
      url,
      images: ogImageUrl
        ? [{ url: ogImageUrl, width: override?.width ?? 1200, height: override?.height ?? 630, alt: title }]
        : undefined,
    },
    twitter: {
      card: ogImageUrl ? "summary_large_image" : "summary",
      title,
      description,
      images: ogImageUrl ? [ogImageUrl] : undefined,
    },
  };
}

export default async function FightPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const fight = getFight(slug);
  if (!fight) notFound();

  const receipts = (
    await Promise.all(fight.receiptsPosts.map((s) => getPostBySlug(s)))
  ).filter((p): p is NonNullable<typeof p> => Boolean(p));

  const others = FIGHTS.filter((f) => f.slug !== fight.slug);
  const url = `${SITE.url}/fights/${fight.slug}`;
  const shareText = `${fight.title}: ${fight.short} — Ryan Nichols, realryannichols.com/fights/${fight.slug}`;

  return (
    <article className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <nav className="text-sm text-[var(--color-muted)] mb-4">
        <Link href="/fights" className="hover:underline">
          ← All the fights
        </Link>
      </nav>

      <div className="rounded-3xl border-2 border-[var(--color-accent)] bg-gradient-to-br from-[var(--color-accent-soft)] to-[var(--color-surface)] p-6 sm:p-10">
        <p className="text-[11px] uppercase tracking-[0.25em] text-[var(--color-accent)] font-bold">
          {fight.tag}
        </p>
        <h1 className="mt-2 text-4xl sm:text-5xl font-bold tracking-tight leading-[1.04] font-display">
          {fight.title}
        </h1>
        <p className="mt-4 text-base sm:text-xl text-[var(--color-ink-soft)] leading-relaxed">
          {fight.lede}
        </p>
      </div>

      <div className="mt-5">
        <ShareRail url={url} title={shareText} />
      </div>
      <div className="mt-3">
        <ReactionBar
          targetType="page"
          targetId={`fight-${fight.slug}`}
          prompt="Is this your fight too? Tap — no signup."
        />
      </div>

      {/* What's at stake */}
      <section className="mt-8 rounded-2xl border-2 border-[var(--color-accent)] bg-[var(--color-accent-soft)] p-5 sm:p-6">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-accent)] font-bold">
          What&apos;s at stake
        </p>
        <p className="mt-2 text-lg sm:text-xl font-bold tracking-tight font-display text-[var(--color-ink)] leading-snug">
          {fight.stakes}
        </p>
      </section>

      <div className="prose-body mt-8 space-y-5">
        {fight.body.map((para, i) => (
          <p key={i} className="text-base sm:text-lg text-[var(--color-ink)] leading-relaxed">
            {para}
          </p>
        ))}
      </div>

      {/* Where I stand — the planks */}
      <section className="mt-10">
        <h2 className="text-xl font-bold tracking-tight font-display">Where I stand</h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Not slogans — concrete positions.
        </p>
        <ul className="mt-4 space-y-3">
          {fight.planks.map((p, i) => (
            <li
              key={i}
              className="flex gap-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4"
            >
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)] text-[var(--color-paper)] text-xs font-bold tabular-nums">
                {i + 1}
              </span>
              <span className="text-base text-[var(--color-ink)] leading-snug font-semibold">
                {p}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {fight.statements && fight.statements.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-xl font-bold tracking-tight font-display">In my own words</h2>
          <div className="mt-4 space-y-4">
            {fight.statements.map((s, i) => {
              if (s.kind === "tweet" || s.kind === "video") {
                return <TweetEmbed key={i} url={s.url} />;
              }
              return (
                <blockquote
                  key={i}
                  className="border-l-4 border-[var(--color-accent)] pl-4 py-1 text-[var(--color-ink-soft)]"
                >
                  <p className="text-lg leading-relaxed">&ldquo;{s.text}&rdquo;</p>
                  {s.sourceUrl ? (
                    <a
                      href={s.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block text-xs font-semibold text-[var(--color-accent)] hover:underline"
                    >
                      {s.sourceLabel ?? "Source"}
                      {s.date ? ` · ${s.date}` : ""} →
                    </a>
                  ) : null}
                </blockquote>
              );
            })}
          </div>
        </section>
      ) : null}

      {receipts.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-xl font-bold tracking-tight font-display">The receipts</h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Not talk — documented, on this site.
          </p>
          <div className="mt-4 grid gap-3">
            {receipts.map((p) => (
              <Link
                key={p.slug}
                href={`/posts/${p.slug}`}
                className="block rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 hover:border-[var(--color-accent)] transition"
              >
                <p className="text-sm font-bold text-[var(--color-ink)] leading-snug">
                  {p.title ?? "Read the post"}
                </p>
                <span className="mt-1 inline-block text-xs font-semibold text-[var(--color-accent)]">
                  Read it →
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {fight.caseLinks && fight.caseLinks.length > 0 ? (
        <section className="mt-8 flex flex-wrap gap-3">
          {fight.caseLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-full border-2 border-[var(--color-line)] px-4 py-2 text-sm font-bold text-[var(--color-ink-soft)] hover:border-[var(--color-accent)]"
            >
              {l.label} →
            </Link>
          ))}
        </section>
      ) : null}

      <section className="mt-10 rounded-2xl border-2 border-[var(--color-accent)] bg-[var(--color-accent-soft)] p-6 sm:p-8">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight font-display">
          Take this fight home.
        </h2>
        <p className="mt-2 text-sm sm:text-base text-[var(--color-ink-soft)] max-w-2xl">
          I do this with no organization behind me and no middleman taking a cut.
          If this is your fight too, the most powerful things you can do are share
          it — and read the whole story for yourself.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/book/preorder"
            className="rounded-full border-2 border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-paper)] px-5 py-2.5 text-sm font-bold hover:bg-[var(--color-accent-strong)]"
          >
            Get the Book →
          </Link>
          <Link
            href="/submit"
            className="rounded-full border-2 border-[var(--color-blue)] bg-[var(--color-blue)] text-[var(--color-paper)] px-5 py-2.5 text-sm font-bold hover:bg-[var(--color-blue-strong)]"
          >
            Send a tip →
          </Link>
        </div>
      </section>

      <section className="mt-10 border-t border-[var(--color-line)] pt-6">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-muted)] font-bold">
          The other fights
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {others.map((f) => (
            <Link
              key={f.slug}
              href={`/fights/${f.slug}`}
              className="block rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 hover:border-[var(--color-accent)] transition"
            >
              <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-accent)] font-bold">
                {f.tag}
              </p>
              <p className="mt-1 text-sm font-bold text-[var(--color-ink)]">{f.title}</p>
            </Link>
          ))}
        </div>
      </section>
    </article>
  );
}
