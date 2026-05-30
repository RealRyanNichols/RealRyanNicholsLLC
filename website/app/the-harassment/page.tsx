import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { getSupabaseStaticClient } from "@/lib/supabase/static";
import { getOgImage } from "@/lib/og-images";
import { SITE } from "@/lib/site";
import { ShareRail } from "@/components/ShareRail";
import { ReactionBar } from "@/components/ReactionBar";

export const revalidate = 300;

const TITLE =
  "The receipts wall — every brigade, threat, and ban directed at a pardoned J6 defendant";
const DESCRIPTION =
  "Every documented attack, mass-report brigade, death threat, account ban, and coordinated harassment campaign aimed at Ryan Nichols and other pardoned January 6 defendants. The record, in public.";

export async function generateMetadata(): Promise<Metadata> {
  const override = await getOgImage("/the-harassment");
  const url = `${SITE.url}/the-harassment`;
  const ogImageUrl = override?.image_url ?? null;
  return {
    title: override?.title ?? "The Receipts Wall",
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

// The signature double-standard panel. Every line here is already documented
// in Ryan's own published account of the bans (see /fights/first-amendment):
// trivial words got him suspended while explicit death-wishes aimed at him
// were left up. Presented side-by-side so the asymmetry is impossible to miss.
const BANNED_FOR = [
  { text: "“Space Force”", note: "Two words. A suspension trigger." },
  { text: "“discombobulater”", note: "A made-up word. Flagged anyway." },
  {
    text: "A parody account’s brigade",
    note: "Almost seven straight days locked off X.",
  },
];

const STAYED_UP = [
  { text: "“Rot in Hell you unAmerican scum”", note: "Aimed at me. Left up." },
  { text: "“you deserve life in prison”", note: "Aimed at me. Left up." },
  {
    text: "“casually getting your account banned”",
    note: "A verified parody account, bragging in the open. Left up.",
  },
];

type Category = "ban" | "threat" | "brigade" | "other";

const CATEGORY_META: Record<
  Category,
  { label: string; chip: string; tag: string }
> = {
  ban: { label: "Bans & deplatforming", chip: "Bans", tag: "Ban" },
  threat: { label: "Threats", chip: "Threats", tag: "Threat" },
  brigade: { label: "Brigades", chip: "Brigades", tag: "Brigade" },
  other: { label: "On record", chip: "Other", tag: "On record" },
};

function classify(title: string, summary: string | null): Category {
  const t = `${title} ${summary ?? ""}`.toLowerCase();
  if (/\b(ban|banned|suspend|suspended|deplatform|locked|removed|took down|shadow)\b/.test(t))
    return "ban";
  if (/\b(threat|threats|kill|death|die|rot in hell|life in prison|murder|hang|shoot)\b/.test(t))
    return "threat";
  if (/\b(brigade|brigaded|mass.?report|mass report|coordinated|dogpile|swarm)\b/.test(t))
    return "brigade";
  return "other";
}

export default async function ReceiptsWallPage(props: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await props.searchParams;
  const supabase = getSupabaseStaticClient();

  // Pull case_documents tagged with harassment / death-threat / ban themes plus
  // feed posts specifically about harassment, then merge them into one ledger.
  const [{ data: docs }, { data: posts }] = await Promise.all([
    supabase
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
      .limit(200),
    supabase
      .from("posts")
      .select("id, slug, title, body, media, published_at")
      .eq("status", "published")
      .or(
        "title.ilike.%banned%,title.ilike.%harass%,title.ilike.%brigade%,title.ilike.%threat%,body.ilike.%mass-report%,body.ilike.%death threat%",
      )
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(50),
  ]);

  const allItems = [
    ...(docs ?? []).map((d) => ({
      kind: "doc" as const,
      id: d.id,
      title: d.title,
      summary: d.description as string | null,
      date: d.document_date as string | null,
      source: d.source as string | null,
      href: `/case/documents/${d.slug}`,
      external: d.external_url as string | null,
    })),
    ...(posts ?? []).map((p) => ({
      kind: "post" as const,
      id: p.id,
      title: p.title ?? "(no title)",
      summary: typeof p.body === "string" ? p.body.slice(0, 400) : null,
      date: p.published_at as string | null,
      source: "realryannichols.com feed",
      href: `/posts/${p.slug}`,
      external: null as string | null,
    })),
  ]
    .map((it) => ({ ...it, category: classify(it.title, it.summary) }))
    .sort(
      (a, b) =>
        (b.date ? new Date(b.date).getTime() : 0) -
        (a.date ? new Date(a.date).getTime() : 0),
    );

  const counts: Record<Category, number> = { ban: 0, threat: 0, brigade: 0, other: 0 };
  for (const it of allItems) counts[it.category] += 1;

  const activeType = (["ban", "threat", "brigade"] as const).find((c) => c === type) ?? null;
  const items = activeType ? allItems.filter((it) => it.category === activeType) : allItems;

  const url = `${SITE.url}/the-harassment`;

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      {/* ---- Hero ---- */}
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-accent)] font-bold">
        Receipts wall
      </p>
      <h1 className="mt-2 text-3xl sm:text-5xl font-bold tracking-tight leading-[1.05] font-display">
        Every brigade, threat, and ban — kept in public.
      </h1>
      <p className="mt-4 text-base sm:text-lg text-[var(--color-ink-soft)] max-w-3xl leading-relaxed">
        Pardoned by President Trump on January 20, 2025. Charges{" "}
        <strong>dismissed with prejudice</strong>. The case cannot be brought
        again — and the attacks did not stop. This is the running ledger of every
        coordinated mass-report brigade, death threat, deplatforming, and
        on-record attack aimed at Ryan Nichols and other pardoned January 6
        defendants. Receipts only: dated, sourced, screenshotted.
      </p>

      {/* ---- The double standard ---- */}
      <section className="mt-8 rounded-3xl border-2 border-[var(--color-line)] bg-[var(--color-surface)] overflow-hidden">
        <div className="px-5 sm:px-7 pt-6">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-accent)] font-bold">
            The double standard · in their own words
          </p>
          <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight font-display">
            Same platform. Same week.
          </h2>
        </div>
        <div className="mt-5 grid sm:grid-cols-2">
          {/* What got him banned */}
          <div className="px-5 sm:px-7 pb-6 sm:border-r-2 border-[var(--color-line)]">
            <div className="flex items-center gap-2">
              <span className="text-lg">🚫</span>
              <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-accent)]">
                What got me banned
              </h3>
            </div>
            <ul className="mt-3 space-y-3">
              {BANNED_FOR.map((b) => (
                <li
                  key={b.text}
                  className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-display font-bold text-[var(--color-ink)] leading-snug">
                      {b.text}
                    </p>
                    <span className="flex-shrink-0 rounded bg-[var(--color-accent)] text-[var(--color-paper)] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                      Suspended
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">{b.note}</p>
                </li>
              ))}
            </ul>
          </div>
          {/* What stayed up — inverted dark panel for weight */}
          <div className="px-5 sm:px-7 pb-6 pt-6 sm:pt-0 bg-[var(--color-ink)] text-[var(--color-paper)] sm:bg-transparent sm:text-inherit">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-accent)]">
                What they let stay up
              </h3>
            </div>
            <ul className="mt-3 space-y-3">
              {STAYED_UP.map((s) => (
                <li
                  key={s.text}
                  className="rounded-xl border border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-paper)] p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-display font-bold leading-snug">{s.text}</p>
                    <span className="flex-shrink-0 rounded border border-[var(--color-paper)]/40 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider opacity-80">
                      Still up
                    </span>
                  </div>
                  <p className="mt-1 text-xs opacity-60">{s.note}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="px-5 sm:px-7 py-4 bg-[var(--color-accent-soft)] text-sm sm:text-base font-bold text-[var(--color-accent-strong)] text-center">
          Trivial words: banned. Death wishes: allowed. That&apos;s not
          moderation — that&apos;s a thumb on the scale.
        </p>
      </section>

      {/* ---- React + share ---- */}
      <div className="mt-5">
        <ReactionBar
          targetType="page"
          targetId="receipts-wall"
          prompt="Seen this double standard yourself? Tap — no signup."
        />
      </div>
      <div className="mt-3">
        <ShareRail
          url={url}
          title="They banned a pardoned Marine for the words “Space Force” and “discombobulater” — and left “Rot in Hell” and “you deserve life in prison” up against him. The receipts: realryannichols.com/the-harassment"
        />
      </div>

      {/* ---- Tally band (live counts) ---- */}
      {allItems.length > 0 ? (
        <section className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat n={allItems.length} label="Receipts on the wall" sub="Dated & sourced" />
          <Stat n={counts.ban} label="Bans & deplatforming" sub="Documented" />
          <Stat n={counts.threat} label="Threats logged" sub="Kept in public" />
          <Stat n={counts.brigade} label="Brigades" sub="Mass-report campaigns" />
        </section>
      ) : null}

      {/* ---- Ledger ---- */}
      <section className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[var(--color-line)] pb-3">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight font-display">
            The ledger
          </h2>
          {allItems.length > 0 ? (
            <nav className="flex flex-wrap gap-2" aria-label="Filter receipts by type">
              <Chip href="/the-harassment" label="All" count={allItems.length} active={!activeType} />
              {(["ban", "threat", "brigade"] as const)
                .filter((c) => counts[c] > 0)
                .map((c) => (
                  <Chip
                    key={c}
                    href={`/the-harassment?type=${c}`}
                    label={CATEGORY_META[c].chip}
                    count={counts[c]}
                    active={activeType === c}
                  />
                ))}
            </nav>
          ) : null}
        </div>

        <div className="mt-5 space-y-4">
          {items.length === 0 ? (
            <p className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6 text-center text-[var(--color-ink-soft)] italic">
              {allItems.length === 0
                ? "The ledger is still filling. As receipts come in — DMs, X mentions, comments, news, court filings, ban notices — they get documented here permanently."
                : "No receipts in this category yet. "}
              {allItems.length > 0 && activeType ? (
                <Link href="/the-harassment" className="not-italic font-semibold text-[var(--color-accent)] hover:underline">
                  Show all →
                </Link>
              ) : null}
            </p>
          ) : (
            items.map((it) => (
              <article
                key={`${it.kind}-${it.id}`}
                className="rounded-2xl border-2 border-[var(--color-line)] bg-[var(--color-surface)] p-5 sm:p-6 hover:border-[var(--color-accent)] transition"
              >
                <div className="flex flex-wrap items-baseline gap-2 mb-2">
                  <span className="rounded-full bg-[var(--color-accent)] text-[var(--color-paper)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                    {CATEGORY_META[it.category].tag}
                  </span>
                  {it.date ? (
                    <span className="text-xs text-[var(--color-muted)] font-semibold tabular-nums">
                      {format(new Date(it.date), "MMM d, yyyy")}
                    </span>
                  ) : null}
                  {it.source ? (
                    <span className="text-xs text-[var(--color-muted)]">· {it.source}</span>
                  ) : null}
                </div>
                <h3 className="text-lg sm:text-xl font-bold tracking-tight leading-snug">
                  <Link href={it.href} className="hover:text-[var(--color-accent)]">
                    {it.title}
                  </Link>
                </h3>
                {it.summary ? (
                  <p className="mt-2 text-sm text-[var(--color-ink-soft)] line-clamp-3 whitespace-pre-wrap">
                    {it.summary}
                  </p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-3 text-xs">
                  <Link href={it.href} className="text-[var(--color-accent)] font-semibold hover:underline">
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
        </div>
      </section>

      {/* ---- Submit CTA ---- */}
      <section className="mt-12 rounded-2xl border-2 border-[var(--color-blue)] bg-[var(--color-blue-soft)] p-5 sm:p-7">
        <p className="text-xs uppercase tracking-wider font-bold text-[var(--color-blue)]">
          Witnessing it yourself?
        </p>
        <h2 className="mt-1 text-xl sm:text-2xl font-bold tracking-tight font-display">
          See a brigade, a threat, a coordinated attack? Send it.
        </h2>
        <p className="mt-2 text-sm sm:text-base text-[var(--color-ink-soft)] leading-snug max-w-2xl">
          Screenshot the tweet, the comment, the email, the message — paste it
          into the tip line. Anonymous if you want. It lands here, dated and
          sourced, and becomes part of the permanent record. The harder they
          push, the longer this wall gets.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/submit"
            className="inline-block rounded-full border-2 border-[var(--color-blue)] bg-[var(--color-blue)] text-[var(--color-paper)] px-5 py-2.5 text-sm font-bold hover:bg-[var(--color-blue-strong)]"
          >
            📩 Submit a receipt →
          </Link>
          <Link
            href="/case"
            className="inline-block rounded-full border-2 border-[var(--color-line)] bg-[var(--color-surface)] px-5 py-2.5 text-sm font-bold text-[var(--color-ink)] hover:border-[var(--color-accent)]"
          >
            The J6 Case →
          </Link>
        </div>
      </section>
    </main>
  );
}

function Stat({ n, label, sub }: { n: number; label: string; sub: string }) {
  return (
    <div className="rounded-2xl border-2 border-[var(--color-line)] bg-[var(--color-surface)] p-4">
      <div className="text-3xl sm:text-4xl font-bold tracking-tight leading-none text-[var(--color-accent)] font-display tabular-nums">
        {n}
      </div>
      <div className="mt-2 text-sm font-bold text-[var(--color-ink)] leading-tight">{label}</div>
      <div className="text-[11px] uppercase tracking-wider text-[var(--color-muted)] mt-0.5">
        {sub}
      </div>
    </div>
  );
}

function Chip({
  href,
  label,
  count,
  active,
}: {
  href: string;
  label: string;
  count: number;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={[
        "rounded-full border px-3 py-1.5 text-xs font-bold transition",
        active
          ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-paper)]"
          : "border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-ink-soft)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]",
      ].join(" ")}
    >
      {label} · {count}
    </Link>
  );
}
