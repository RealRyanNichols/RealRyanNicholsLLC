import type { Metadata } from "next";
import Link from "next/link";
import { getSupabaseStaticClient } from "@/lib/supabase/static";
import { getOgImage } from "@/lib/og-images";
import { SITE } from "@/lib/site";
import { ShareRail } from "@/components/ShareRail";
import { ReactionBar } from "@/components/ReactionBar";

// The flagship evidence landing page. Dramatic front door that funnels
// into the searchable salvaged record + the three analytic lenses.
export const revalidate = 300;

const TITLE =
  "Evidence the DOJ Tried to Erase — the scrubbed January 6 master record, preserved";
const DESCRIPTION =
  "The Biden DOJ published a master list of every American it prosecuted for January 6 — then deleted it after the pardons. We saved the last complete snapshot: 1,092 defendants, 3,230 federal documents, every charge and sentence. Verifiable against the Internet Archive. It is not coming down.";

const WAYBACK =
  "https://web.archive.org/web/20231201000000/https://www.justice.gov/usao-dc/capitol-breach-cases";

export async function generateMetadata(): Promise<Metadata> {
  const override = await getOgImage("/evidence-the-doj-tried-to-erase");
  const url = `${SITE.url}/evidence-the-doj-tried-to-erase`;
  // Default to a strong existing card; an override row can swap a
  // bespoke graphic in later without a code change.
  const ogUrl = override?.image_url ?? `${SITE.url}/social-cards/j6-mission.jpg`;
  return {
    title: override?.title ?? "Evidence the DOJ Tried to Erase",
    description: override?.description ?? DESCRIPTION,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: override?.title ?? TITLE,
      description: override?.description ?? DESCRIPTION,
      url,
      images: [
        {
          url: ogUrl,
          width: override?.width ?? 1200,
          height: override?.height ?? 630,
          alt: TITLE,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: override?.title ?? TITLE,
      description: override?.description ?? DESCRIPTION,
      images: [ogUrl],
    },
  };
}

export default async function EvidenceErasedPage() {
  const supabase = getSupabaseStaticClient();

  const [
    { count: preserved },
    { count: matched },
    { count: sentenced },
    { data: docAgg },
  ] = await Promise.all([
    supabase.from("doj_capitol_archive").select("id", { count: "exact", head: true }),
    supabase
      .from("doj_capitol_archive")
      .select("id", { count: "exact", head: true })
      .not("matched_person_id", "is", null),
    supabase
      .from("doj_capitol_archive")
      .select("id", { count: "exact", head: true })
      .ilike("status_text", "%sentenced%"),
    supabase
      .from("doj_capitol_archive")
      .select("doc_urls")
      .not("doc_urls", "is", null)
      .limit(2000),
  ]);

  const docLinks = (docAgg ?? []).reduce(
    (s: number, r: { doc_urls: string[] | null }) => s + (r.doc_urls?.length ?? 0),
    0,
  );
  const preservedN = preserved ?? 0;
  const matchedN = matched ?? 0;
  const sentencedN = sentenced ?? 0;

  return (
    <article className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
      {/* ── Hero — dark command-screen gravity ───────────────────── */}
      <div className="rounded-3xl border-2 border-[var(--color-blue)] bg-gradient-to-br from-[#0a1429] via-[#0e1a36] to-[#1c2a4a] p-6 sm:p-10 relative overflow-hidden">
        <div
          className="pointer-events-none absolute -top-32 -right-32 h-80 w-80 rounded-full blur-3xl"
          style={{ background: "rgba(127, 227, 169, 0.16)" }}
          aria-hidden
        />
        <p className="relative text-[11px] uppercase tracking-[0.25em] text-[#e1bd5b] font-bold flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-[#e1bd5b] animate-pulse" />
          Public record · preserved · verifiable
        </p>
        <h1 className="relative mt-3 text-4xl sm:text-6xl font-bold tracking-tight leading-[1.02] font-display text-[var(--color-paper)]">
          Evidence the DOJ Tried to Erase
        </h1>
        <p className="relative mt-5 text-base sm:text-xl text-[#cfd9ea] leading-relaxed max-w-3xl">
          The Biden Justice Department published a master list of every
          American it prosecuted for January 6 — every name, every charge,
          every sentence, every court filing. Then, after President Trump
          pardoned us on <strong className="text-[var(--color-paper)]">January 20, 2025</strong>,
          they took it down. The page that documented what they did now
          returns <span className="font-mono text-[#ff9b9b]">&ldquo;Page not found.&rdquo;</span>
        </p>
        <p className="relative mt-4 text-base sm:text-xl text-[#cfd9ea] leading-relaxed max-w-3xl">
          We pulled the last complete snapshot before it vanished.{" "}
          <strong className="text-[#e1bd5b]">Every name. Every case number.
          Every document.</strong> It is all here, it is all verifiable
          against the Internet Archive, and{" "}
          <strong className="text-[var(--color-paper)]">it is not coming down.</strong>
        </p>

        {/* Counters */}
        <div className="relative mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3">
          <DarkStat value={preservedN} label="Defendants preserved" />
          <DarkStat value={docLinks} label="Federal documents saved" />
          <DarkStat value={sentencedN} label="With sentencing on record" />
          <DarkStat value={matchedN} label="Matched to live profiles" />
        </div>
      </div>

      <div className="mt-5">
        <ShareRail
          url={`${SITE.url}/evidence-the-doj-tried-to-erase`}
          title="The Biden DOJ deleted its master list of every January 6 defendant after the pardons. It's preserved here — 1,092 names, 3,230 documents, verifiable against the Internet Archive: realryannichols.com/evidence-the-doj-tried-to-erase"
        />
      </div>

      <div className="mt-4">
        <ReactionBar
          targetType="evidence"
          targetId="evidence-the-doj-tried-to-erase"
          prompt="They tried to erase it. Tap how that hits you — no signup."
        />
      </div>

      {/* ── What they erased ──────────────────────────────────────── */}
      <section className="mt-10 max-w-3xl">
        <p className="text-xs uppercase tracking-wider text-[var(--color-accent)] font-bold">
          What came down
        </p>
        <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight font-display">
          A government deleted its own ledger of the people it prosecuted.
        </h2>
        <div className="mt-3 prose-body text-sm sm:text-base">
          <p>
            For years, the U.S. Attorney&apos;s Office for the District of
            Columbia kept a single public page —{" "}
            <span className="font-mono break-all">
              justice.gov/usao-dc/capitol-breach-cases
            </span>{" "}
            — listing every January 6 defendant it charged. Name, case
            number, charges, the running status of each case, and links to
            the actual court documents. It was the federal government&apos;s
            own master record.
          </p>
          <p>
            Sometime after the January 20, 2025 pardons, it disappeared.
            The URL now serves a &ldquo;Page not found.&rdquo; Whatever the
            reason, the effect is the same: the canonical record of what was
            done to <strong>{preservedN.toLocaleString()}</strong> Americans
            no longer lives where it always lived.
          </p>
          <p>
            <strong>So we saved it.</strong> Every defendant row from the
            last complete capture, parsed and preserved — {docLinks.toLocaleString()}{" "}
            document links intact, every case status the government
            published, cross-checked against an independent third-party
            archive. The integrity of the public record does not depend on
            whether the prosecuting government chooses to keep it online.
          </p>
        </div>
      </section>

      {/* ── Walk the evidence four ways ───────────────────────────── */}
      <section className="mt-10">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight font-display">
          Walk the evidence four ways.
        </h2>
        <p className="mt-2 text-sm sm:text-base text-[var(--color-ink-soft)] max-w-2xl">
          The same preserved record, explorable from every angle. Search a
          name, walk the network, scrub the timeline, or read the map.
        </p>
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <LensCard
            href="/case/the-salvaged-doj-record"
            kicker="The archive"
            title="Search the salvaged record"
            sub={`All ${preservedN.toLocaleString()} preserved defendants — search by name, case number, or state. Every entry links to the original document on the Wayback Machine.`}
          />
          <LensCard
            href="/case/nexus"
            kicker="The graph"
            title="The Case Nexus"
            sub="A force-directed map of every co-defendant cluster the DOJ filed. Drag, zoom, and walk the network of who was charged with whom."
          />
          <LensCard
            href="/case/timeline"
            kicker="The wave"
            title="The prosecution timeline"
            sub="Every arrest and sentencing on the time axis, month by month. Watch the wave the previous DOJ ran across four years."
          />
          <LensCard
            href="/case/geography"
            kicker="The map"
            title="The geography"
            sub="Every defendant by home state — the choropleth of a nationwide prosecution. Click any state to see its names."
          />
        </div>
      </section>

      {/* ── Provenance — this is what makes it evidence ───────────── */}
      <section className="mt-10 rounded-2xl border-2 border-[var(--color-blue)] bg-[var(--color-blue-soft)] p-5 sm:p-6">
        <p className="text-xs uppercase tracking-wider font-bold text-[var(--color-blue)]">
          Why this is evidence, not a claim
        </p>
        <h2 className="mt-1 text-xl sm:text-2xl font-bold tracking-tight font-display">
          Every byte traces back to the government&apos;s own page.
        </h2>
        <p className="mt-2 text-sm sm:text-base text-[var(--color-ink-soft)] leading-relaxed max-w-3xl">
          This isn&apos;t a screenshot you have to trust. The source is the
          U.S. Attorney&apos;s Office, D.C., <em>Capitol Breach Cases</em>{" "}
          page, captured by the non-profit Internet Archive on{" "}
          <strong>December 1, 2023</strong> — the federal government&apos;s
          own master listing as it stood that day. Anyone can verify any
          entry against the same independent snapshot:
        </p>
        <a
          href={WAYBACK}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block font-mono text-xs sm:text-sm text-[var(--color-blue)] underline break-all hover:text-[var(--color-blue-strong)]"
        >
          {WAYBACK}
        </a>
        <p className="mt-3 text-xs text-[var(--color-muted)]">
          Original DOJ URL (now offline):{" "}
          <span className="font-mono break-all">
            https://www.justice.gov/usao-dc/capitol-breach-cases
          </span>
        </p>
      </section>

      {/* ── CTAs ──────────────────────────────────────────────────── */}
      <section className="mt-10 rounded-2xl border-2 border-[var(--color-accent)] bg-[var(--color-surface)] p-6 sm:p-8">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight font-display">
          Keep it from being erased again.
        </h2>
        <p className="mt-2 text-sm sm:text-base text-[var(--color-ink-soft)] max-w-2xl">
          The reason a record disappears is that not enough people were
          holding a copy. Here&apos;s how to be one of them.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/j6"
            className="rounded-full border-2 border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-paper)] px-5 py-2.5 text-sm font-bold hover:bg-[var(--color-accent-strong)]"
          >
            J6 defendant? Claim your profile →
          </Link>
          <Link
            href="/support"
            className="rounded-full border-2 border-[var(--color-blue)] bg-[var(--color-blue)] text-[var(--color-paper)] px-5 py-2.5 text-sm font-bold hover:bg-[var(--color-blue-strong)]"
          >
            Help keep it online →
          </Link>
          <Link
            href="/submit"
            className="rounded-full border-2 border-[var(--color-line)] bg-[var(--color-paper)] px-5 py-2.5 text-sm font-bold text-[var(--color-ink)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
          >
            Send a tip / receipt →
          </Link>
        </div>
      </section>

      <p className="mt-8 text-sm text-[var(--color-muted)] italic max-w-3xl">
        Posted from realryannichols.com — my own domain, my own server. A
        federal government scrubbed the record. A pardoned veteran preserved
        it. That asymmetry is the whole point.
      </p>
    </article>
  );
}

function DarkStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl border border-[#3a557c] bg-[#0a1429]/60 p-4">
      <div className="text-3xl sm:text-4xl font-bold tabular-nums tracking-tight leading-none text-[#e1bd5b]">
        {value.toLocaleString()}
      </div>
      <div className="mt-2 text-[10px] uppercase tracking-wider text-[#a9b7d0] font-bold">
        {label}
      </div>
    </div>
  );
}

function LensCard({
  href,
  kicker,
  title,
  sub,
}: {
  href: string;
  kicker: string;
  title: string;
  sub: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-2xl border-2 border-[var(--color-line)] bg-[var(--color-paper)] p-5 hover:border-[var(--color-accent)] transition group"
    >
      <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-muted)] font-bold">
        {kicker}
      </p>
      <p className="mt-1 text-lg font-bold tracking-tight text-[var(--color-ink)] group-hover:text-[var(--color-accent)]">
        {title} <span aria-hidden>→</span>
      </p>
      <p className="mt-1.5 text-sm leading-snug text-[var(--color-ink-soft)]">
        {sub}
      </p>
    </Link>
  );
}
