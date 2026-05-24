import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { getSupabaseStaticClient } from "@/lib/supabase/static";
import { getOgImage } from "@/lib/og-images";
import { SITE } from "@/lib/site";

export const revalidate = 300;

const TITLE =
  "The harassment wall — every brigade, threat, and ban directed at a pardoned J6 defendant";
const DESCRIPTION =
  "Every documented attack, mass-report brigade, death threat, account ban, and coordinated harassment campaign aimed at Ryan Nichols and other pardoned January 6 defendants. The record, in public.";

export async function generateMetadata(): Promise<Metadata> {
  const override = await getOgImage("/the-harassment");
  const url = `${SITE.url}/the-harassment`;
  const ogImageUrl = override?.image_url ?? null;
  return {
    title: override?.title ?? "The Harassment Wall",
    description: override?.description ?? DESCRIPTION,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: override?.title ?? TITLE,
      description: override?.description ?? DESCRIPTION,
      url,
      images: ogImageUrl
        ? [
            {
              url: ogImageUrl,
              width: override?.width ?? 1200,
              height: override?.height ?? 630,
              alt: TITLE,
            },
          ]
        : undefined,
    },
    twitter: {
      card: ogImageUrl ? "summary_large_image" : "summary",
      title: override?.title ?? TITLE,
      description: override?.description ?? DESCRIPTION,
      images: ogImageUrl ? [ogImageUrl] : undefined,
    },
  };
}

export default async function HarassmentWallPage() {
  const supabase = getSupabaseStaticClient();

  // Pull case_documents that we've tagged with the harassment / death_threats
  // themes. The Liam Nissan X-ban incident, future threats, brigade
  // campaigns, deplatforming events, etc. all live here.
  const { data: docs } = await supabase
    .from("case_documents")
    .select(
      "id, slug, title, description, doc_type, document_date, external_url, file_url, source",
    )
    .eq("visibility", "public")
    .eq("archived", false)
    .or(
      "title.ilike.%banned%,title.ilike.%harass%,title.ilike.%brigade%,title.ilike.%threat%,description.ilike.%harass%,description.ilike.%brigade%,description.ilike.%death threat%",
    )
    .order("document_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(200);

  // Also include feed posts that are specifically about harassment so
  // the Liam Nissan post shows here even before it's mirrored into
  // case_documents.
  const { data: posts } = await supabase
    .from("posts")
    .select("id, slug, title, body, media, published_at")
    .eq("status", "published")
    .or(
      "title.ilike.%banned%,title.ilike.%harass%,title.ilike.%brigade%,title.ilike.%threat%,body.ilike.%mass-report%,body.ilike.%death threat%",
    )
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(50);

  const items = [
    ...(docs ?? []).map((d) => ({
      kind: "doc" as const,
      id: d.id,
      slug: d.slug,
      title: d.title,
      summary: d.description,
      date: d.document_date,
      source: d.source,
      href: `/case/documents/${d.slug}`,
      external: d.external_url,
      image: d.file_url,
    })),
    ...(posts ?? []).map((p) => ({
      kind: "post" as const,
      id: p.id,
      slug: p.slug,
      title: p.title ?? "(no title)",
      summary: typeof p.body === "string" ? p.body.slice(0, 400) : null,
      date: p.published_at,
      source: "realryannichols.com feed",
      href: `/posts/${p.slug}`,
      external: null,
      image:
        Array.isArray(p.media) && p.media[0] && typeof p.media[0] === "object"
          ? (p.media[0] as { url?: string }).url ?? null
          : null,
    })),
  ];

  // Sort the combined list newest-first.
  items.sort(
    (a, b) =>
      (b.date ? new Date(b.date).getTime() : 0) -
      (a.date ? new Date(a.date).getTime() : 0),
  );

  return (
    <article className="mx-auto max-w-4xl px-4 py-10">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-accent)] font-bold">
        Receipts wall
      </p>
      <h1 className="mt-2 text-3xl sm:text-5xl font-bold tracking-tight leading-[1.05] font-display">
        Every brigade, threat, and ban — kept in public.
      </h1>
      <p className="mt-4 text-base sm:text-lg text-[var(--color-ink-soft)] max-w-3xl leading-relaxed">
        Pardoned by President Trump on January 20, 2025. Charges{" "}
        <strong>dismissed with prejudice</strong>. The case cannot be brought
        again. The attacks did not stop. This page is the running ledger of
        every coordinated mass-report brigade, death threat, harassment
        campaign, deplatforming, and on-record attack aimed at Ryan Nichols
        and other pardoned January 6 defendants — receipts only, dated,
        sourced, screen-shotted.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/submit"
          className="rounded-full border-2 border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-paper)] px-5 py-2.5 text-sm font-bold hover:bg-[var(--color-accent-strong)]"
        >
          📩 Got a receipt? Send it →
        </Link>
        <Link
          href="/case"
          className="rounded-full border-2 border-[var(--color-line)] bg-[var(--color-surface)] px-5 py-2.5 text-sm font-bold text-[var(--color-ink)] hover:border-[var(--color-accent)]"
        >
          The J6 Case →
        </Link>
      </div>

      <section className="mt-10 space-y-4">
        {items.length === 0 ? (
          <p className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6 text-center text-[var(--color-ink-soft)] italic">
            The wall is empty — for now. As receipts come in (DMs, X
            mentions, comments, news, court filings, account-ban notices),
            they get documented here permanently.
          </p>
        ) : (
          items.map((it) => (
            <article
              key={`${it.kind}-${it.id}`}
              className="rounded-2xl border-2 border-[var(--color-line)] bg-[var(--color-surface)] p-5 sm:p-6 hover:border-[var(--color-accent)] transition"
            >
              <div className="flex flex-wrap items-baseline gap-2 mb-2">
                <span className="rounded-full bg-[var(--color-accent)] text-[var(--color-paper)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  {it.kind === "doc" ? "Evidence" : "On record"}
                </span>
                {it.date ? (
                  <span className="text-xs text-[var(--color-muted)] font-semibold tabular-nums">
                    {format(new Date(it.date), "MMM d, yyyy")}
                  </span>
                ) : null}
                {it.source ? (
                  <span className="text-xs text-[var(--color-muted)]">
                    · {it.source}
                  </span>
                ) : null}
              </div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight leading-snug">
                <Link
                  href={it.href}
                  className="hover:text-[var(--color-accent)]"
                >
                  {it.title}
                </Link>
              </h2>
              {it.summary ? (
                <p className="mt-2 text-sm text-[var(--color-ink-soft)] line-clamp-3 whitespace-pre-wrap">
                  {it.summary}
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-3 text-xs">
                <Link
                  href={it.href}
                  className="text-[var(--color-accent)] font-semibold hover:underline"
                >
                  Read the full receipt →
                </Link>
                {it.external ? (
                  <a
                    href={it.external}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--color-muted)] hover:text-[var(--color-accent)] hover:underline"
                  >
                    Original source ↗
                  </a>
                ) : null}
              </div>
            </article>
          ))
        )}
      </section>

      <section className="mt-12 rounded-2xl border-2 border-[var(--color-blue)] bg-[var(--color-blue-soft)] p-5 sm:p-6">
        <p className="text-xs uppercase tracking-wider font-bold text-[var(--color-blue)]">
          Witnessing it yourself?
        </p>
        <h2 className="mt-1 text-xl sm:text-2xl font-bold tracking-tight font-display">
          See a brigade, a threat, a coordinated attack? Send it.
        </h2>
        <p className="mt-2 text-sm sm:text-base text-[var(--color-ink-soft)] leading-snug">
          Screenshot the tweet, the comment, the email, the message — paste it
          into the tip line. Anonymous if you want. It lands here, dated and
          sourced, and becomes part of the permanent record. The harder they
          push, the more it ends up on this page.
        </p>
        <Link
          href="/submit"
          className="mt-4 inline-block rounded-full border-2 border-[var(--color-blue)] bg-[var(--color-blue)] text-[var(--color-paper)] px-5 py-2.5 text-sm font-bold hover:bg-[var(--color-blue-strong)]"
        >
          Submit a receipt →
        </Link>
      </section>
    </article>
  );
}
